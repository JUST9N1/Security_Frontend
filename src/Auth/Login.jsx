import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  Input,
  Row,
  Spin,
  Typography,
} from "antd";
import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import registerImage from "../assets/login3.jpeg";
import { BASE_URL } from "../config";
import { AuthContext } from "../contexts/AuthContext";

const Login = () => {
  // ---- EXISTING STATE ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [otp, setOtp] = useState("");
  const [isSentOtp, setIsSentOtp] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [phone, setPhone] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);

  // ---- NEW STATE FOR PASSWORD VISIBILITY ----
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  // ---- NEW STATE FOR LOCKOUT/ATTEMPTS ----
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [lockTime, setLockTime] = useState(null);
  const [timer, setTimer] = useState(null);

  const timerRef = useRef(null);

  const [passwordStrength, setPasswordStrength] = useState(0);

  // State to track if passwords match
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const navigate = useNavigate();
  const { dispatch } = useContext(AuthContext);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;
    setPasswordStrength((strength / 5) * 100);
  };

  const handleReset = async (e) => {
    e.preventDefault();

    if (resetPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Check if password strength is strong before allowing reset
    if (passwordStrength < 70) {
      toast.error("Password is too weak! Please choose a stronger password.");
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/auth/reset_password`, {
        phone: phone,
        otp: otp,
        password: resetPassword,
      });

      if (response.status === 200) {
        toast.success(response.data.message);
        setShow(false);
        setResetPassword("");
        setConfirmPassword("");
        setIsSentOtp(false);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status < 500) {
          toast.error(error.response.message);
        }
        toast.error(error.response.message);
      }
    }
  };

  const sentOtp = async (e) => {
    e.preventDefault();

    // Validate phone number input
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/auth/forgot_password`, {
        phone: phone.trim(), 
      });

      if (response.status === 200) {
        toast.success(response.data.message);
        setIsSentOtp(true); 
      } else {
        toast.error(response.data.message || "Failed to send OTP.");
      }
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Failed to send OTP.");
      } else {
        console.log(error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  // ---- NEW FUNCTION TO HANDLE COUNTDOWN ----
  const startCountdown = (lockDuration) => {
    let currentTime = lockDuration; // lockDuration in seconds
    setTimer(currentTime);

    timerRef.current = setInterval(() => {
      currentTime -= 1;
      setTimer(currentTime);

      if (currentTime <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setTimer(null);
        setLockTime(null);
      }
    }, 1000);
  };

  // Clear any intervals if this component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // ---- EXISTING CAPTCHA HANDLER ----
  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  // ---- EXISTING HANDLE LOGIN (ONLY ADD NEW LINES) ----
  const handleLogin = async (values) => {
    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const result = await res.json();

      // Handle specific status codes
      if (res.status === 400) {
        setLoading(false);
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
          toast.error(
            `${result.message}. ${result.remainingAttempts} attempt(s) left before lock.`
          );
        } else {
          toast.error(result.message || "Login failed. Please try again.");
        }
        return;
      } else if (res.status === 403) {
        setLoading(false);
        if (result.remainingTime) {
          setLockTime(result.remainingTime);
          startCountdown(result.remainingTime);
          toast.error(
            `Account locked. Try again in ${result.remainingTime} seconds.`
          );
        } else {
          toast.error(result.message || "Account locked!");
        }
        return;
      }

      // Check for other errors
      if (!res.ok) {
        throw new Error(result.message || "Login failed.");
      }

      // Store session data in sessionStorage
      sessionStorage.setItem("token", result.token); // Store JWT token
      sessionStorage.setItem("user", JSON.stringify(result.data)); // Store user details

      // Dispatch to context for global state management
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: result.data,
          role: result.role,
          token: result.token,
        },
      });

      toast.success(result.message || "Login successful!");
      navigate("/home");
    } catch (error) {
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---- EXISTING RETURN (UI / LAYOUT) ----

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setResetPassword(password);
    calculatePasswordStrength(password);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (resetPassword !== e.target.value) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  return (
    <div className="center-wrapper">
      <section className="px-5 lg:px-0">
        <div className="w-full max-w-[1170px] mx-auto rounded-lg shadow md:p-10 justify-center">
          <Card className="form-container">
            <Flex gap="large" align="center">
              {/* Form */}
              <Flex vertical flex={1} style={{ padding: "20px" }}>
                <Typography.Title level={3} strong className="title">
                  Sign In
                </Typography.Title>
                <Typography.Text type="secondary" strong className="slogan">
                  Connect with us!
                </Typography.Text>
                <Form
                  layout="vertical"
                  onFinish={handleLogin}
                  autoComplete="off"
                >
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Please input your email!" },
                      { type: "email", message: "Please input a valid email!" },
                    ]}
                  >
                    <Input size="large" placeholder="Enter your email!" />
                  </Form.Item>
                  <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                      {
                        required: true,
                        message: "Please input your password!",
                      },
                    ]}
                  >
                    <Input.Password
                      size="large"
                      placeholder="Enter your password!"
                    />
                  </Form.Item>
                  {error && (
                    <Alert
                      description={error}
                      type="error"
                      showIcon
                      closable
                      className="alert"
                    />
                  )}
                  <Form.Item>
                    {/* Google reCAPTCHA */}
                    <ReCAPTCHA
                      sitekey="6Lc9FL0qAAAAACESI-gPez1IjqjlcvoymufCNeCM" // Your site key
                      onChange={handleCaptchaChange}
                    />
                  </Form.Item>
                  <Form.Item>
                    <div className="mt-7">
                      <Button
                        type={loading ? "default" : "primary"}
                        htmlType="submit"
                        className="w-full bg-primaryColor text-white text-[18px] leading-[30px] rounded-lg px-4 py-3 flex justify-center items-center"
                        size="large"
                        block
                      >
                        {loading ? <Spin /> : "Sign In"}
                      </Button>
                    </div>
                  </Form.Item>
                  <Form.Item>
                    <Row justify="end">
                      <Link onClick={() => setShow(true)}>Forgot Password</Link>
                      {/* Modal for Forgot Password */}
                      <div
                        className={`modal fade ${show ? "show" : ""}`}
                        style={{ display: show ? "block" : "none" }}
                        id="exampleModal"
                        tabIndex="-1"
                        aria-labelledby="exampleModalLabel"
                        aria-hidden={!show}
                      >
                        <div className="modal-dialog">
                          <div className="modal-content">
                            <div className="modal-header">
                              <h1
                                className="modal-title fs-5"
                                id="exampleModalLabel"
                              >
                                Forgot Password
                              </h1>
                              <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                                onClick={() => setShow(false)}
                              ></button>
                            </div>
                            <div className="modal-body">
                              <div className="mb-3">
                                <form>
                                  <label
                                    htmlFor="exampleInputPhone1"
                                    className="form-label"
                                  >
                                    Phone No.
                                  </label>
                                  <div className="row">
                                    <div className="col-8">
                                      <Input
                                        type="tel"
                                        id="exampleInputPhone1"
                                        value={phone}
                                        onChange={(e) =>
                                          setPhone(e.target.value)
                                        }
                                        size="large"
                                        disabled={isSentOtp}
                                        placeholder="Enter your phone number"
                                      />
                                    </div>
                                    <div className="col-4">
                                      <Button
                                        type="primary"
                                        size="large"
                                        disabled={isSentOtp}
                                        onClick={sentOtp}
                                      >
                                        Get OTP
                                      </Button>
                                    </div>
                                  </div>
                                </form>
                                {isSentOtp && (
                                  <form>
                                    <div className="mb-3">
                                      <label
                                        htmlFor="otpInput"
                                        className="form-label"
                                      >
                                        OTP
                                      </label>
                                      <Input
                                        type="number"
                                        id="otpInput"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        size="large"
                                        placeholder="Enter OTP"
                                      />
                                    </div>
                                    <div className="mb-3">
                                      <label
                                        htmlFor="newPasswordInput"
                                        className="form-label"
                                      >
                                        New Password
                                      </label>
                                      <Input.Password
                                        id="newPasswordInput"
                                        value={resetPassword}
                                        onChange={handlePasswordChange}
                                        size="large"
                                        placeholder="Enter your new password"
                                        type={
                                          isPasswordVisible
                                            ? "text"
                                            : "password"
                                        }
                                        suffix={
                                          isPasswordVisible ? (
                                            <EyeOutlined
                                              onClick={togglePasswordVisibility}
                                            />
                                          ) : (
                                            <EyeInvisibleOutlined
                                              onClick={togglePasswordVisibility}
                                            />
                                          )
                                        }
                                      />
                                      <div className="mt-2">
                                        <div
                                          className="progress"
                                          style={{
                                            height: "10px",
                                            backgroundColor: "#e0e0e0",
                                          }}
                                        >
                                          <div
                                            className="progress-bar"
                                            role="progressbar"
                                            style={{
                                              width: `${passwordStrength}%`,
                                              backgroundColor:
                                                passwordStrength < 40
                                                  ? "red"
                                                  : passwordStrength < 70
                                                  ? "yellow"
                                                  : "green",
                                            }}
                                            aria-valuenow={passwordStrength}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                          ></div>
                                        </div>
                                        <small>
                                          Password strength:{" "}
                                          {passwordStrength < 40
                                            ? "Weak"
                                            : passwordStrength < 70
                                            ? "Medium"
                                            : "Strong"}
                                        </small>
                                      </div>
                                    </div>
                                    <Form.Item
                                      label="Confirm Password"
                                      validateStatus={
                                        !passwordsMatch ? "error" : ""
                                      }
                                      help={
                                        !passwordsMatch
                                          ? "Passwords do not match!"
                                          : ""
                                      }
                                    >
                                      <Input.Password
                                        id="confirmPasswordInput"
                                        value={confirmPassword}
                                        onChange={handleConfirmPasswordChange}
                                        size="large"
                                        placeholder="Confirm your password"
                                        type={
                                          isConfirmPasswordVisible
                                            ? "text"
                                            : "password"
                                        }
                                        suffix={
                                          isConfirmPasswordVisible ? (
                                            <EyeOutlined
                                              onClick={
                                                toggleConfirmPasswordVisibility
                                              }
                                            />
                                          ) : (
                                            <EyeInvisibleOutlined
                                              onClick={
                                                toggleConfirmPasswordVisibility
                                              }
                                            />
                                          )
                                        }
                                      />
                                    </Form.Item>
                                    <Button
                                      type="primary"
                                      size="large"
                                      onClick={handleReset}
                                      disabled={
                                        passwordStrength < 70 || !passwordsMatch
                                      }
                                      block
                                    >
                                      Reset Password
                                    </Button>
                                  </form>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Row>
                    <Form.Item>
                      <Row justify="center">
                        <Typography.Text type="secondary">
                          Don't have an account?{" "}
                          <Link to="/register">Register</Link>
                        </Typography.Text>
                      </Row>
                    </Form.Item>
                  </Form.Item>
                </Form>
              </Flex>

              {/* Image */}
              <Flex flex={1}>
                <img
                  src={registerImage}
                  alt="Register"
                  className="auth-image"
                />
              </Flex>
            </Flex>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Login;
