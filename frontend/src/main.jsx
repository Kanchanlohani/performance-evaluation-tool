import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = "http://localhost:5000/api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("priya@ashoka.test");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();

    const response = await fetch(`${API}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!response.ok) {
      setError("Invalid credentials");
      return;
    }

    const user = await response.json();
    onLogin(user);
  }

  return (
    <main className="login">
      <form onSubmit={submit} className="card login-card">
        <h1>Performance Evaluation</h1>

        <p className="muted">
          Monthly employee feedback
        </p>

        <label>Email</label>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
        />

        <label>Password</label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />

        {error && <p className="error">{error}</p>}

        <button type="submit">
          Login
        </button>
      </form>
    </main>
  );
}

function EmployeeApp({ user }) {
  const [tab, setTab] = useState("home");
  const [feedback, setFeedback] = useState([]);
  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState(null);
  const [parameters, setParameters] = useState([]);

  async function load() {
    const [history, pendingData, params] = await Promise.all([
      fetch(`${API}/employees/${user.id}/feedback`).then((r) => r.json()),
      fetch(`${API}/employees/${user.id}/pending`).then((r) => r.json()),
      fetch(`${API}/parameters`).then((r) => r.json())
    ]);

    setFeedback(history);
    setPending(pendingData);
    setParameters(params);
  }

  useEffect(() => {
    load();
  }, [user.id]);

  return (
    <div>
      <header>
        <div>
          <strong>Performance Evaluation</strong>

          <span className="company">
            {user.name}
          </span>
        </div>

        <nav>
          <button
            className={tab === "home" ? "active" : ""}
            onClick={() => setTab("home")}
          >
            My Feedback
          </button>

          <button
            className={tab === "give" ? "active" : ""}
            onClick={() => setTab("give")}
          >
            Give Feedback
          </button>
        </nav>
      </header>

      <main className="container">

        {tab === "home" && (
          <section>
            <h2>My Feedback</h2>

            {feedback.length === 0 ? (
              <p className="muted">
                No feedback yet.
              </p>
            ) : (
              feedback.map((item) => (
                <div className="card" key={item.id}>

                  <div className="row">

                    <div>
                      <h3>
                        {new Date(
                          item.cycle.month
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            month: "long",
                            year: "numeric"
                          }
                        )}
                      </h3>

                      <p className="muted">
                        From {item.reviewer.name}
                      </p>
                    </div>

                    <span
                      className={`status ${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>

                  </div>

                  {item.status === "SUBMITTED" && (
                    <div className="scores">

                      {item.scores.map((score) => (
                        <div
                          className="score"
                          key={score.id}
                        >
                          <span>
                            {score.parameter.name}
                          </span>

                          <strong>
                            {score.score}/5
                          </strong>
                        </div>
                      ))}

                    </div>
                  )}

                </div>
              ))
            )}
          </section>
        )}

        {tab === "give" && (
          <section>

            <h2>Feedback to Give</h2>

            {pending.length === 0 && (
              <p className="muted">
                No pending feedback.
              </p>
            )}

            {pending.map((item) => (
              <div
                className="card row"
                key={item.id}
              >
                <div>
                  <h3>
                    {item.employee.name}
                  </h3>

                  <p className="muted">
                    {item.employee.title || "Employee"}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setSelected(item.id)
                  }
                >
                  Give Feedback
                </button>
              </div>
            ))}

            {selected && (
              <FeedbackForm
                feedbackId={selected}
                parameters={parameters}
                onDone={() => {
                  setSelected(null);
                  load();
                }}
              />
            )}

          </section>
        )}

      </main>
    </div>
  );
}

function FeedbackForm({
  feedbackId,
  parameters,
  onDone
}) {
  const [scores, setScores] = useState(
    parameters.map((parameter) => ({
      parameterId: parameter.id,
      score: 0,
      reason: ""
    }))
  );

  const [error, setError] = useState("");

  function updateScore(index, key, value) {
    setScores((current) =>
      current.map((score, i) =>
        i === index
          ? {
              ...score,
              [key]: value
            }
          : score
      )
    );
  }

  async function submit(e) {
    e.preventDefault();

    if (
      scores.some(
        (score) =>
          !score.score ||
          !score.reason.trim()
      )
    ) {
      setError(
        "Please provide a score and reason for every parameter."
      );

      return;
    }

    const response = await fetch(
      `${API}/feedback/${feedbackId}/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          scores: scores.map((score) => ({
            ...score,
            score: Number(score.score)
          }))
        })
      }
    );

    if (!response.ok) {
      setError(
        "Unable to submit feedback."
      );

      return;
    }

    onDone();
  }

  return (
    <form
      className="card feedback-form"
      onSubmit={submit}
    >
      <h2>Give Feedback</h2>

      {parameters.map((parameter, index) => (
        <div
          className="parameter"
          key={parameter.id}
        >

          <label>
            {parameter.name}
          </label>

          <div className="score-buttons">

            {[1, 2, 3, 4, 5].map((number) => (
              <button
                type="button"
                className={
                  scores[index].score === number
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  updateScore(
                    index,
                    "score",
                    number
                  )
                }
                key={number}
              >
                {number}
              </button>
            ))}

          </div>

          <textarea
            placeholder="Why did you give this score?"
            value={scores[index].reason}
            onChange={(e) =>
              updateScore(
                index,
                "reason",
                e.target.value
              )
            }
          />

        </div>
      ))}

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <button type="submit">
        Submit Feedback
      </button>
    </form>
  );
}

function HRApp({ user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(
      `${API}/hr/${user.companyId}/overview`
    )
      .then((response) => response.json())
      .then((result) => setData(result));
  }, [user.companyId]);

  if (!data) {
    return (
      <main className="container">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <div>

      <header>
        <div>
          <strong>
            Performance Evaluation
          </strong>

          <span className="company">
            HR Dashboard
          </span>
        </div>
      </header>

      <main className="container">

        <h2>
          Feedback Completion
        </h2>

        <div className="summary">

          <div className="card">
            <span>Total</span>
            <strong>
              {data.completion.total}
            </strong>
          </div>

          <div className="card">
            <span>Submitted</span>
            <strong>
              {data.completion.submitted}
            </strong>
          </div>

          <div className="card">
            <span>Pending</span>
            <strong>
              {data.completion.pending}
            </strong>
          </div>

        </div>

        <div className="card">

          <h3>
            Reviewer Status
          </h3>

          <table>

            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Total</th>
                <th>Submitted</th>
                <th>Pending</th>
                <th>Pending Employees</th>
              </tr>
            </thead>

            <tbody>

              {data.reviewers.map((reviewer) => (
                <tr key={reviewer.reviewerId}>

                  <td>
                    {reviewer.reviewer}
                  </td>

                  <td>
                    {reviewer.total}
                  </td>

                  <td>
                    {reviewer.submitted}
                  </td>

                  <td>
                    {reviewer.pending}
                  </td>

                  <td>
                    {reviewer.pendingEmployees.join(
                      ", "
                    ) || "—"}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </main>

    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (user.role === "HR") {
    return <HRApp user={user} />;
  }

  return <EmployeeApp user={user} />;
}

createRoot(
  document.getElementById("root")
).render(
  <App />
);
