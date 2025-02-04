import React, { useState, useEffect } from "react";
import "./User.css";

function User() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState(["Great article!", "Very insightful."]);
    const NEWS_API_KEY = "8280846cdd1a49ef880809767d0e61c8";
    const [voteCount, setVoteCount] = useState(0);

    // Fetch news from API
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch(
                    `https://newsapi.org/v2/everything?q=elections&apiKey=${NEWS_API_KEY}`
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch news");
                }
                const data = await response.json();
                setNews(data.articles.slice(0, 3)); // Limit to 3 articles
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);


    const handleVote = () => {
        setVoteCount(voteCount + 1);
    };

    const handleAddComment = () => {
        if (comment.trim()) {
            setComments([...comments, comment]);
            setComment("");
        }
    };

    return (
        <div className="user-profile">
            <div className="profile-header">
                <h1>Welcome, User!</h1>
                <p>Explore the latest news and engage with the community!</p>
            </div>


            <div className="profile-content">
                <div className="news-container">
                    {loading ? (
                        <p>Loading news...</p>
                    ) : error ? (
                        <p className="error-message">Error: {error}</p>
                    ) : (
                        news.map((article, index) => (
                            <div key={index} className="news-item">
                                <h3>{article.title}</h3>
                                <p>{article.description}</p>
                                <a href={article.url} target="_blank" rel="noopener noreferrer">
                                    Read more
                                </a>
                            </div>
                        ))
                    )}
                </div>

                <h2>Vote</h2>
                <p>Votes: {voteCount}</p>
                <button className="vote-button" onClick={handleVote} aria-label="Vote for this content">
                    Vote for this content
                </button>

                <h2>Comments</h2>
                <div className="comment-box">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Write your comment here..."
                        aria-label="Write your comment"
                    ></textarea>
                    <button className="comment-button" onClick={handleAddComment} aria-label="Add Comment">
                        Add Comment
                    </button>
                </div>
               <div className="comments-card">
            <h3 className="comments-title">Community Comments</h3>
            <ul className="comments-list">
                {comments.map((cmt, idx) => (
                    <li key={idx} className="comment-item">
                        {cmt}
                    </li>
                ))}
            </ul>
        </div>
            </div>
        </div>
    );
}

export default User;
