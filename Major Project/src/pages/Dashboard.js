import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegCalendarAlt, FaRegFlag, FaRegCommentDots, FaUserCircle, FaChartBar, FaEdit, FaTrash } from "react-icons/fa";
import "./Dashboard.css";

const STATUS_COLORS = {
    Active: "#4CAF50",
    Closed: "#F44336",
    Upcoming: "#2196F3",
    Default: "#9E9E9E"
};

const NEWS_API_KEY = "8280846cdd1a49ef880809767d0e61c8";

const Dashboard = () => {
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    // States
    const [currentUser] = useState({ id: 1, name: "Alice Smith", isAdmin: true });
    const [elections, setElections] = useState(() => {
        const saved = localStorage.getItem('elections');
        return saved ? JSON.parse(saved) : [
            {
                id: 1,
                name: "Student Council Election",
                status: "Active",
                description: "Vote for your student representatives",
                endDate: "2024-12-20",
                candidates: [
                    { id: 1, name: "John Doe", position: "President", votes: 145 },
                    { id: 2, name: "Jane Smith", position: "Vice President", votes: 120 },
                ],
                voters: []
            },
            {
                id: 2,
                name: "Company Representative Election",
                status: "Closed",
                description: "Annual company board selection",
                endDate: "2024-11-30",
                candidates: [
                    { id: 3, name: "Mike Johnson", position: "Board Member", votes: 89 },
                    { id: 4, name: "Sarah Williams", position: "Board Member", votes: 92 },
                ],
                voters: []
            },
        ];
    });

    const [selectedElection, setSelectedElection] = useState(null);
    const [editingElection, setEditingElection] = useState(null);
    const [news, setNews] = useState([]);
    const [isLoadingNews, setIsLoadingNews] = useState(true);
    const [comments, setComments] = useState(() => {
        const saved = localStorage.getItem('comments');
        return saved ? JSON.parse(saved) : [];
    });
    const [newComment, setNewComment] = useState("");
    const [showCandidates, setShowCandidates] = useState(false);
    const [chatMessages, setChatMessages] = useState(() => {
        const saved = localStorage.getItem('chatMessages');
        return saved ? JSON.parse(saved) : [
            { id: 1, user: "System", message: "Welcome to the election discussion!", timestamp: new Date() },
        ];
    });
    const [newMessage, setNewMessage] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    // LocalStorage persistence
    useEffect(() => {
        localStorage.setItem('elections', JSON.stringify(elections));
    }, [elections]);

    useEffect(() => {
        localStorage.setItem('comments', JSON.stringify(comments));
    }, [comments]);

    useEffect(() => {
        localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
    }, [chatMessages]);

    // Update time every minute for countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch news effect
    useEffect(() => {
        const fetchNews = async () => {
            setIsLoadingNews(true);
            try {
                const response = await fetch(
                    `https://newsapi.org/v2/everything?q=election&language=en&sortBy=publishedAt&pageSize=6&apiKey=${NEWS_API_KEY}`
                );
                const data = await response.json();

                if (data.articles) {
                    const formattedNews = data.articles.map((article, index) => ({
                        id: index + 1,
                        title: article.title,
                        description: article.description || "No description available",
                        imageUrl: article.urlToImage || "https://via.placeholder.com/350x200",
                        url: article.url,
                        source: article.source.name,
                        publishedAt: new Date(article.publishedAt).toLocaleDateString()
                    }));
                    setNews(formattedNews);
                }
            } catch (error) {
                console.error("Error fetching news:", error);
                setNews([{
                    id: 1,
                    title: "Election Updates",
                    description: "Stay informed about the latest election news",
                    imageUrl: "https://via.placeholder.com/350x200",
                    source: "Local News",
                    publishedAt: new Date().toLocaleDateString()
                }]);
            } finally {
                setIsLoadingNews(false);
            }
        };

        fetchNews();
    }, []);

    // Scroll chat to bottom effect
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    // Helper functions
    const calculateTimeRemaining = (endDate) => {
        const end = new Date(endDate);
        const diff = end - currentTime;

        if (diff <= 0) return "Ended";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${days}d ${hours}h ${minutes}m left`;
    };

    const getStatusColor = (status) => STATUS_COLORS[status] || STATUS_COLORS.Default;

    // Election management
    const addElection = () => {
        const newElection = {
            id: Date.now(),
            name: `New Election ${elections.length + 1}`,
            status: "Upcoming",
            description: "Click to add description",
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            candidates: [],
            voters: []
        };
        setElections(prev => [...prev, newElection]);
    };

    const handleDeleteElection = (id) => {
        if (window.confirm("Are you sure you want to delete this election?")) {
            setElections(prev => prev.filter(e => e.id !== id));
            if (selectedElection?.id === id) {
                setSelectedElection(null);
                setShowCandidates(false);
            }
        }
    };

    const handleSaveElection = () => {
        setElections(prev =>
            prev.map(e => e.id === editingElection.id ? editingElection : e)
        );
        setEditingElection(null);
    };

    // Voting functionality
    const handleVote = (candidateId) => {
        if (!currentUser) {
            alert("Please log in to vote!");
            return;
        }

        const electionIndex = elections.findIndex(e => e.id === selectedElection.id);
        if (electionIndex === -1) return;

        const election = elections[electionIndex];
        if (election.voters.includes(currentUser.id)) {
            alert("You've already voted in this election!");
            return;
        }

        const updatedCandidates = election.candidates.map(candidate =>
            candidate.id === candidateId
                ? { ...candidate, votes: candidate.votes + 1 }
                : candidate
        );

        const updatedElection = {
            ...election,
            candidates: updatedCandidates,
            voters: [...election.voters, currentUser.id]
        };

        const updatedElections = [...elections];
        updatedElections[electionIndex] = updatedElection;
        setElections(updatedElections);
        setSelectedElection(updatedElection);
    };

    // Comment and chat functions
    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const commentToAdd = {
            id: Date.now(),
            text: newComment.trim(),
            user: currentUser.name,
            timestamp: new Date(),
            likes: 0
        };
        setComments(prev => [...prev, commentToAdd]);
        setNewComment("");
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        const messageToAdd = {
            id: Date.now(),
            user: currentUser.name,
            message: newMessage.trim(),
            timestamp: new Date()
        };
        setChatMessages(prev => [...prev, messageToAdd]);
        setNewMessage("");
    };

    const handleLikeComment = (commentId) => {
        setComments(prev =>
            prev.map(comment =>
                comment.id === commentId
                    ? { ...comment, likes: (comment.likes || 0) + 1 }
                    : comment
            )
        );
    };

    return (
        <div className="dashboard-container">
            <header>
                <h1>Decentralized Voting System Dashboard</h1>
                <div className="user-info">
                    <FaUserCircle size={24} />
                    <span>{currentUser.name} {currentUser.isAdmin && "(Admin)"}</span>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Elections Section */}
                <section className="election-section">
                    <div className="section-header">
                        <h2>Available Elections</h2>
                        {currentUser.isAdmin && (
                            <button className="auth-button add-election-btn" onClick={addElection}>
                                Add Election
                            </button>
                        )}
                    </div>

                    <div className="election-cards">
                        {elections.map((election) => (
                            <div
                                key={election.id}
                                className="election-card interactive"
                                onClick={() => setSelectedElection(election)}
                                style={{ borderLeft: `5px solid ${getStatusColor(election.status)}` }}
                            >
                                <div className="election-info">
                                    <h3>{election.name}</h3>
                                    <p className="description">{election.description}</p>
                                    <div className="election-meta">
                                        <p className="end-date">
                                            {calculateTimeRemaining(election.endDate)}
                                        </p>
                                        <p className="status" style={{ color: getStatusColor(election.status) }}>
                                            {election.status}
                                        </p>
                                    </div>
                                </div>
                                {currentUser.isAdmin && (
                                    <div className="election-actions">
                                        <button
                                            className="icon-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingElection(election);
                                            }}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="icon-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteElection(election.id);
                                            }}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* News Section */}
                <section className="news-section">
                    <h2>Latest Election News</h2>
                    <div className="news-cards">
                        {isLoadingNews ? (
                            <div className="loading">Loading news...</div>
                        ) : (
                            news.map((item) => (
                                <div
                                    className="news-card"
                                    key={item.id}
                                    onClick={() => window.open(item.url, '_blank')}
                                >
                                    <img
                                        src={item.imageUrl}
                                        alt={`News about ${item.title}`}
                                        className="news-image"
                                    />
                                    <div className="news-content">
                                        <h3>{item.title}</h3>
                                        <p>{item.description}</p>
                                        <div className="news-meta">
                                            <span>{item.source}</span>
                                            <span>{item.publishedAt}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Chat Section */}
                <section className="chat-section">
                    <h2>Live Discussion</h2>
                    <div className="chat-container">
                        <div className="chat-messages">
                            {chatMessages.map((msg) => (
                                <div key={msg.id} className={`chat-message ${msg.user === "System" ? "system" : ""}`}>
                                    <strong>{msg.user}:</strong>
                                    <p>{msg.message}</p>
                                    <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="chat-input">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button onClick={handleSendMessage} className="auth-button">
                                Send
                            </button>
                        </div>
                    </div>
                </section>

                {/* Comments Section */}
                <section className="comments-section">
                    <h2>Voter Opinions</h2>
                    <div className="comments-display">
                        {comments.map((comment) => (
                            <div className="comment-card" key={comment.id}>
                                <div className="comment-header">
                                    <FaUserCircle className="user-avatar" />
                                    <span className="username">{comment.user}</span>
                                    <span className="timestamp">
                                        {new Date(comment.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <p>{comment.text}</p>
                                <div className="comment-actions">
                                    <button
                                        className="like-button"
                                        onClick={() => handleLikeComment(comment.id)}
                                    >
                                        👍 {comment.likes || 0}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="add-comment">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Share your opinion..."
                            className="comment-input"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <button
                            onClick={handleAddComment}
                            className="auth-button"
                            disabled={!newComment.trim()}
                        >
                            Add Opinion
                        </button>
                    </div>
                </section>

                {/* Candidates Modal */}
                {selectedElection && (
                    <div className="modal">
                        <div className="modal-content">
                            <h2>{selectedElection.name} - Candidates</h2>
                            <div className="candidates-grid">
                                {selectedElection.candidates.map(candidate => (
                                    <div key={candidate.id} className="candidate-card">
                                        <FaUserCircle size={50} className="candidate-avatar" />
                                        <h3>{candidate.name}</h3>
                                        <p>{candidate.position}</p>
                                        {selectedElection.status === "Closed" ? (
                                            <div className="votes-info">
                                                <FaChartBar /> {candidate.votes} votes
                                            </div>
                                        ) : (
                                            selectedElection.voters.includes(currentUser.id) ? (
                                                <div className="voted-label">You've voted</div>
                                            ) : (
                                                <button
                                                    className="vote-button"
                                                    onClick={() => handleVote(candidate.id)}
                                                >
                                                    Vote Now
                                                </button>
                                            )
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                className="auth-button"
                                onClick={() => setSelectedElection(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit Election Modal */}
                {editingElection && (
                    <div className="modal">
                        <div className="modal-content">
                            <h2>Edit Election</h2>
                            <div className="form-group">
                                <label>Election Name:</label>
                                <input
                                    value={editingElection.name}
                                    onChange={(e) => setEditingElection({
                                        ...editingElection,
                                        name: e.target.value
                                    })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description:</label>
                                <textarea
                                    value={editingElection.description}
                                    onChange={(e) => setEditingElection({
                                        ...editingElection,
                                        description: e.target.value
                                    })}
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date:</label>
                                <input
                                    type="date"
                                    value={editingElection.endDate}
                                    onChange={(e) => setEditingElection({
                                        ...editingElection,
                                        endDate: e.target.value
                                    })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button className="auth-button" onClick={handleSaveElection}>
                                    Save Changes
                                </button>
                                <button
                                    className="auth-button cancel"
                                    onClick={() => setEditingElection(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;