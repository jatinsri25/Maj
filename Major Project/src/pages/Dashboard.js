import React, { useState } from "react";
import "./Auth.css";

const Dashboard = () => {
    const [elections, setElections] = useState([
        { id: 1, name: "Student Council Election", status: "Active" },
        { id: 2, name: "Company Representative Election", status: "Closed" },
    ]);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Dashboard</h2>
                <p>Welcome to the Decentralized Voting System Dashboard!</p>

                <div className="form-group">
                    <h3>Available Elections:</h3>
                    <ul className="election-list">
                        {elections.map((election) => (
                            <li key={election.id} className="election-item">
                                <strong>{election.name}</strong> - <span className={election.status === "Active" ? "active-status" : "inactive-status"}>{election.status}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="button-container">
                    <button
                        className="auth-button"
                        onClick={() => alert("Create new election feature coming soon!")}
                    >
                        Create New Election
                    </button>

                    <button
                        className="auth-button add-election-button"
                        onClick={() => setElections([
                            ...elections,
                            { id: elections.length + 1, name: "New Election", status: "Upcoming" }
                        ])}
                    >
                        Add Election
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
