import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  IconButton,
  InputAdornment
} from "@mui/material";
import { Visibility, VisibilityOff, Email, Lock } from "@mui/icons-material";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🔹 Attempting Login...");
    console.log("🔹 Email:", email);
    console.log("🔹 Password:", password.replace(/./g, "*")); // Mask password for security

    try {
      const res = await axios.post(`${API_URL}/api/login`, {
        email,
        password,
      });

      console.log("✅ Login Successful! Token received:", res.data.token);
      localStorage.setItem("token", res.data.token);
      
      console.log("🔹 Redirecting to Dashboard...");
      navigate("/dashboard");
      
    } catch (err: unknown) {  // ✅ Use `unknown` for better safety
      if (axios.isAxiosError(err)) {
        console.error("❌ Login failed", err.response?.data || err.message);
      } else {
        console.error("❌ An unexpected error occurred", err);
      }
    }
    
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 8, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Login
        </Typography>
        <form onSubmit={handleLogin}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="contained" color="primary">
              Login
            </Button>
            <Typography variant="body2">
              Don't have an account?{" "}
              <Button onClick={() => navigate("/register")} variant="text">
                Register
              </Button>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;
