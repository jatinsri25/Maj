import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import "./Auth.css";

const Signup = () => {
    const navigate = useNavigate();
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const detectionInterval = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [authStep, setAuthStep] = useState('credentials');
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [faceQuality, setFaceQuality] = useState(0);
    const [capturedDescriptor, setCapturedDescriptor] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    // Load face detection models
    const loadModels = async () => {
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
                faceapi.nets.faceExpressionNet.loadFromUri('/models')
            ]);
            return true;
        } catch (error) {
            console.error('Model loading failed:', error);
            return false;
        }
    };

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            const success = await loadModels();
            setModelsLoaded(success);
            setLoading(false);
        };
        initialize();

        return () => {
            if (detectionInterval.current) clearInterval(detectionInterval.current);
            if (webcamRef.current?.video) {
                const stream = webcamRef.current.video.srcObject;
                stream?.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Real-time face detection and landmark drawing
    const detectFace = async () => {
        if (!webcamRef.current || !canvasRef.current || !modelsLoaded) return;

        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const displaySize = { width: video.videoWidth, height: video.videoHeight };

        faceapi.matchDimensions(canvas, displaySize);

        const detection = await faceapi.detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions({
                inputSize: 512,
                scoreThreshold: 0.7
            })
        ).withFaceLandmarks().withFaceDescriptor();

        if (detection) {
            const landmarks = detection.landmarks;
            const score = detection.detection.score;
            setFaceQuality(score * 100);

            // Draw face landmarks
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawFaceLandmarks(canvas, landmarks);
        }

        return detection;
    };

    // Capture face with quality validation
    const captureFace = async () => {
        try {
            const detection = await detectFace();
            if (!detection || detection.detection.score < 0.8) {
                throw new Error('Face not clear enough. Ensure good lighting and face the camera directly.');
            }

            const descriptor = Array.from(detection.descriptor);
            setCapturedDescriptor(descriptor);
            return true;
        } catch (error) {
            console.error('Capture error:', error);
            setErrors({ face: error.message });
            setAttempts(prev => prev + 1);
            return false;
        }
    };

    // Handle face registration
    const handleFaceRegistration = async () => {
        if (attempts >= 3) {
            setErrors({ face: 'Maximum attempts reached. Try again later.' });
            return;
        }

        setLoading(true);
        const success = await captureFace();
        setLoading(false);

        if (success) {
            localStorage.setItem('faceDescriptor', JSON.stringify(capturedDescriptor));
            localStorage.setItem('userDetails', JSON.stringify(formData));
            setRegistrationSuccess(true);
            setTimeout(() => navigate('/dashboard'), 1000);
        }
    };

    // Start real-time detection when webcam is ready
    const handleWebcamStart = () => {
        detectionInterval.current = setInterval(detectFace, 100);
    };

    // Form validation
    const validateCredentials = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }
        if (!formData.password.trim() || formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        return newErrors;
    };

    // Handle credentials submission
    const handleCredentialsSubmit = (e) => {
        e.preventDefault();
        const newErrors = validateCredentials();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
        } else {
            setAuthStep('face');
        }
    };

    // Render credentials step
    const renderCredentialsStep = () => (
        <form onSubmit={handleCredentialsSubmit}>
            <div className="form-group">
                <label>Full Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
            <div className="form-group">
                <label>Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your email"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            <div className="form-group">
                <label>Password</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a password"
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
            </div>
            <button className="auth-button primary" type="submit">
                Continue
            </button>
        </form>
    );

    // Render face registration step
    const renderFaceRegistration = () => (
        <div className="face-registration-container">
            <h3>Face Registration</h3>
            <div className="webcam-wrapper">
                <Webcam
                    ref={webcamRef}
                    className="webcam-feed"
                    screenshotFormat="image/jpeg"
                    onUserMedia={handleWebcamStart}
                    videoConstraints={{
                        facingMode: "user",
                        width: 1280,
                        height: 720
                    }}
                />
                <canvas ref={canvasRef} className="landmarks-canvas" />

                <div className="face-feedback">
                    <div className="quality-indicator">
                        <div className="quality-bar" style={{ width: `${faceQuality}%` }} />
                        <span>Face Quality: {faceQuality.toFixed(0)}%</span>
                    </div>
                    {errors.face && <div className="error-bubble">{errors.face}</div>}
                    {registrationSuccess && (
                        <div className="success-bubble">Registration Successful!</div>
                    )}
                </div>
            </div>

            <div className="capture-controls">
                <button
                    className="auth-button primary"
                    onClick={handleFaceRegistration}
                    disabled={loading || faceQuality < 80}
                >
                    {loading ? 'Processing...' : 'Register Face'}
                </button>
                <button
                    className="auth-button secondary"
                    onClick={() => setAuthStep('credentials')}
                >
                    Back to Info
                </button>
            </div>
        </div>
    );

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>{authStep === 'credentials' ? 'Create Account' : 'Face Registration'}</h2>

                {authStep === 'credentials' ? renderCredentialsStep() : renderFaceRegistration()}

                {authStep === 'credentials' && (
                    <p className="auth-footer">
                        Already have an account?{" "}
                        <button className="text-link" onClick={() => navigate("/login")}>
                            Sign In
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Signup;