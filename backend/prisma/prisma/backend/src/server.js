import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

async function getCurrentCycle(companyId) {
  return prisma.feedbackCycle.findUnique({
    where: {
      companyId_month: {
        companyId,
        month: new Date("2026-08-01T00:00:00.000Z")
      }
    }
  });
}

// Get the five fixed feedback parameters
app.get("/api/parameters", async (req, res) => {
  try {
    const parameters = await prisma.feedbackParameter.findMany({
      orderBy: {
        displayOrder: "asc"
      }
    });

    res.json(parameters);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch parameters" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { email }
    });

    if (!employee || employee.password !== password) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    res.json({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      title: employee.title,
      companyId: employee.companyId
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to login"
    });
  }
});

// Get feedback received by an employee
app.get("/api/employees/:employeeId/feedback", async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: {
        id: req.params.employeeId
      }
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    const feedback = await prisma.feedback.findMany({
      where: {
        employeeId: employee.id
      },
      include: {
        cycle: true,
        reviewer: {
          select: {
            name: true
          }
        },
        scores: {
          include: {
            parameter: true
          },
          orderBy: {
            parameter: {
              displayOrder: "asc"
            }
          }
        }
      },
      orderBy: {
        cycle: {
          month: "desc"
        }
      }
    });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch feedback"
    });
  }
});

// Get feedback assignments that an employee still needs to submit
app.get("/api/employees/:employeeId/pending", async (req, res) => {
  try {
    const feedback = await prisma.feedback.findMany({
      where: {
        reviewerId: req.params.employeeId,
        status: "PENDING"
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            title: true
          }
        },
        cycle: true
      }
    });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch pending feedback"
    });
  }
});

// Get one feedback assignment
app.get("/api/feedback/:feedbackId", async (req, res) => {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: {
        id: req.params.feedbackId
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            title: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true
          }
        },
        cycle: true,
        scores: {
          include: {
            parameter: true
          },
          orderBy: {
            parameter: {
              displayOrder: "asc"
            }
          }
        }
      }
    });

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found"
      });
    }

    res.json(feedback);
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch feedback"
    });
  }
});

// Submit feedback
app.post("/api/feedback/:feedbackId/submit", async (req, res) => {
  try {
    const { scores } = req.body;

    if (!Array.isArray(scores) || scores.length !== 5) {
      return res.status(400).json({
        message: "Five parameter scores are required"
      });
    }

    for (const item of scores) {
      if (
        !Number.isInteger(Number(item.score)) ||
        Number(item.score) < 1 ||
        Number(item.score) > 5 ||
        !item.reason?.trim()
      ) {
        return res.status(400).json({
          message: "Each score must be between 1 and 5 and include a reason"
        });
      }
    }

    const feedback = await prisma.feedback.findUnique({
      where: {
        id: req.params.feedbackId
      }
    });

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found"
      });
    }

    await prisma.feedbackScore.deleteMany({
      where: {
        feedbackId: feedback.id
      }
    });

    await prisma.feedbackScore.createMany({
      data: scores.map((item) => ({
        feedbackId: feedback.id,
        parameterId: item.parameterId,
        score: Number(item.score),
        reason: item.reason
      }))
    });

    const updatedFeedback = await prisma.feedback.update({
      where: {
        id: feedback.id
      },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date()
      }
    });

    res.json(updatedFeedback);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to submit feedback"
    });
  }
});

// HR overview for a company
app.get("/api/hr/:companyId/overview", async (req, res) => {
  try {
    const cycle = await getCurrentCycle(req.params.companyId);

    if (!cycle) {
      return res.status(404).json({
        message: "Feedback cycle not found"
      });
    }

    const feedback = await prisma.feedback.findMany({
      where: {
        cycleId: cycle.id
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const grouped = {};

    for (const item of feedback) {
      if (!grouped[item.reviewerId]) {
        grouped[item.reviewerId] = {
          reviewerId: item.reviewerId,
          reviewer: item.reviewer.name,
          total: 0,
          submitted: 0,
          pending: 0,
          pendingEmployees: []
        };
      }

      grouped[item.reviewerId].total++;

      if (item.status === "SUBMITTED") {
        grouped[item.reviewerId].submitted++;
      } else {
        grouped[item.reviewerId].pending++;
        grouped[item.reviewerId].pendingEmployees.push(
          item.employee.name
        );
      }
    }

    res.json({
      cycle: cycle.month,
      completion: {
        total: feedback.length,
        submitted: feedback.filter(
          (item) => item.status === "SUBMITTED"
        ).length,
        pending: feedback.filter(
          (item) => item.status === "PENDING"
        ).length
      },
      reviewers: Object.values(grouped)
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch HR overview"
    });
  }
});

// Get employees belonging to a company
app.get("/api/company/:companyId/employees", async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        companyId: req.params.companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        role: true
      },
      orderBy: {
        name: "asc"
      }
    });

    res.json(employees);
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch employees"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
