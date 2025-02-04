import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const webcamRef = useRef(null);

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [authStep, setAuthStep] = useState('credentials');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [faceDetected, setFaceDetected] = useState(false);
    const [faceMatched, setFaceMatched] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [attemptCount, setAttemptCount] = useState(0);
    const [confidence, setConfidence] = useState(0);

    const MAX_ATTEMPTS = 3;
    const DETECTION_INTERVAL = 1000;

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        aadharNumber: ''
    });

    // Model loading with enhanced error handling
    const loadModels = async () => {
        const MODEL_URL = process.env.PUBLIC_URL + '/models';
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            return true;
        } catch (error) {
            console.error('Model loading failed:', error);
            setError('Face recognition service unavailable');
            return false;
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
            const modelsSuccess = await loadModels();
            if (modelsSuccess) {
                setModelsLoaded(true);
                setIsRegistering(!localStorage.getItem('faceDescriptor'));
            }
            setLoading(false);
        };

        initializeAuth();

        return () => {
            if (webcamRef.current?.video) {
                const stream = webcamRef.current.video.srcObject;
                stream?.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Enhanced face registration with quality check
    const captureAndStoreFace = async () => {
        if (!webcamRef.current) return false;

        try {
            const detections = await faceapi.detectSingleFace(
                webcamRef.current.video,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 512,
                    scoreThreshold: 0.5
                })
            ).withFaceLandmarks().withFaceDescriptor();

            if (detections && detections.detection.score > 0.8) {
                localStorage.setItem('faceDescriptor',
                    JSON.stringify(Array.from(detections.descriptor)));
                setIsRegistering(false);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Face capture error:', error);
            setError('Face capture failed - ensure proper lighting');
            return false;
        }
    };

    // Advanced face verification with confidence scoring
    const verifyFace = async () => {
        if (!webcamRef.current) return false;

        try {
            const storedDescriptor = new Float32Array(
                JSON.parse(localStorage.getItem('faceDescriptor'))
            );

            const detection = await faceapi.detectSingleFace(
                webcamRef.current.video,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 512,
                    scoreThreshold: 0.5
                })
            ).withFaceLandmarks().withFaceDescriptor();

            if (detection) {
                const distance = faceapi.euclideanDistance(
                    detection.descriptor,
                    storedDescriptor
                );
                const currentConfidence = 1 - Math.min(distance, 1);
                setConfidence(currentConfidence * 100);

                return distance < 0.5;
            }
            return false;
        } catch (error) {
            console.error('Verification error:', error);
            setError('Face verification service error');
            return false;
        }
    };

    // Robust face detection handler with attempt tracking
    const handleFaceDetection = () => {
        if (!webcamRef.current?.video || !modelsLoaded) return;

        const detectionInterval = setInterval(async () => {
            if (attemptCount >= MAX_ATTEMPTS || faceMatched) {
                clearInterval(detectionInterval);
                return;
            }

            try {
                let result;
                if (isRegistering) {
                    result = await captureAndStoreFace();
                } else {
                    result = await verifyFace();
                }

                if (result) {
                    setFaceDetected(true);
                    setFaceMatched(true);
                    setTimeout(() => navigate('/dashboard'), 1500);
                    clearInterval(detectionInterval);
                } else {
                    setAttemptCount(prev => prev + 1);
                    setError(`${isRegistering ?
                        'Face registration failed' : 'Verification failed'} (Attempt ${attemptCount + 1}/${MAX_ATTEMPTS})`);
                }
            } catch (error) {
                console.error('Detection error:', error);
                setError('Face detection service error');
                clearInterval(detectionInterval);
            }
        }, DETECTION_INTERVAL);

        return () => clearInterval(detectionInterval);
    };

    // Form handling functions
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'aadharNumber') {
            const numericValue = value.replace(/\D/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setError('');
    };

    const validateCredentials = () => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Invalid email format');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        return true;
    };

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        if (!validateCredentials()) return;

        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAuthStep('aadhar');
        } finally {
            setLoading(false);
        }
    };

    const handleAadharSubmit = async () => {
        if (formData.aadharNumber.length !== 12) {
            setError('Invalid Aadhar number');
            return;
        }

        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setAuthStep('face');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Secure Biometric Login</h2>
                {error && <div className="error-message">{error}</div>}

                {authStep === 'credentials' && (
                    <form onSubmit={handleCredentialsSubmit}>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter registered email"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Enter password"
                                disabled={loading}
                            />
                        </div>
                        <button
                            className="auth-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Continue"}
                        </button>
                    </form>
                )}

                {authStep === 'aadhar' && (
                    <div className="form-group">
                        <label>Aadhar Number</label>
                        <input
                            type="text"
                            name="aadharNumber"
                            value={formData.aadharNumber}
                            onChange={handleInputChange}
                            placeholder="Enter 12-digit Aadhar"
                            maxLength={12}
                            disabled={loading}
                        />
                        <div className="button-group">
                            <button
                                className="auth-button"
                                onClick={handleAadharSubmit}
                                disabled={loading || formData.aadharNumber.length !== 12}
                            >
                                {loading ? "Verifying..." : "Verify Aadhar"}
                            </button>
                            <button
                                className="auth-button secondary"
                                onClick={() => setAuthStep('credentials')}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}

                {authStep === 'face' && (
                    <div className="face-auth-container">
                        <h3>{isRegistering ? 'Biometric Registration' : 'Face Verification'}</h3>
                        <div className="webcam-wrapper">
                            <Webcam
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="webcam-feed"
                                onUserMedia={handleFaceDetection}
                                mirrored
                            />
                            {faceDetected && (
                                <div className="face-status-overlay">
                                    <div className={`status-indicator ${faceMatched ? 'success' : 'scanning'}`}>
                                        {faceMatched ? '✓ Verified' : 'Scanning...'}
                                    </div>
                                    {!isRegistering && (
                                        <div className="confidence-display">
                                            Confidence: {confidence.toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {attemptCount >= MAX_ATTEMPTS && (
                            <div className="fallback-options">
                                <button
                                    className="auth-button secondary"
                                    onClick={() => setAuthStep('credentials')}
                                >
                                    Try Another Method
                                </button>
                            </div>
                        )}

                        <div className="navigation-buttons">
                            <button
                                className="auth-button secondary"
                                onClick={() => setAuthStep('aadhar')}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;