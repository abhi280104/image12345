import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import {
  Button,
  Container,
  Typography,
  Box,
  Input,
  Card,
  CardMedia,
  IconButton,
  Dialog,
  DialogContent,
  CardActions,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import AnalyticsIcon from "@mui/icons-material/Analytics";

const Dashboard = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [image, setImage] = useState<File | null>(null);
  const [imageList, setImageList] = useState<{ url: string; path: string; analysis?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [analyzedImage, setAnalyzedImage] = useState<{ url: string; analysis: string } | null>(null);
  const [analyzingIndex, setAnalyzingIndex] = useState<number | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // 🔹 Ensure user is authenticated, otherwise redirect to login
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("🚨 No token found. Redirecting to login...");
      navigate("/login");
    } else {
      console.log("🔄 Fetching images...");
      fetchImages();
    }
  }, []);

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("📸 Fetching images from API...");
      const res = await axios.get(`${API_URL}/api/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Images fetched successfully:", res.data.images);
      setImageList(res.data.images);
    } catch (err) {
      console.error("❌ Error fetching images:", err);
    }
  };

  const handleUpload = async () => {
    if (!image) return alert("Please select an image first!");
    setLoading(true);
    console.log("📤 Uploading image...");
  
    try {
      const formData = new FormData();
      formData.append("file", image);
  
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
  
      console.log("✅ Upload Success:", res.data);
  
      // 🟢 Instead of manually adding, refetch all images to get updated presigned URLs
      fetchImages();
  
      setImage(null); // Reset input after upload
    } catch (err) {
      console.error("❌ Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (imageUrl: string, index: number) => {
    setAnalyzingIndex(index);
    console.log(`🔍 Analyzing image ${index}: ${imageUrl}`);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("🚨 No token found. Redirecting to login...");
        alert("Please log in first.");
        return;
      }

      console.log("🔄 Sending image to analysis API...");
      const res = await axios.post(
        `${API_URL}/api/analyze`,
        { image_url: imageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Analysis Response:", res.data);
      const analysisText = res.data.analysis;

      setImageList((prev) => {
        const newList = [...prev];
        newList[index] = { ...newList[index], analysis: analysisText };
        return newList;
      });

      setAnalyzedImage({ url: imageUrl, analysis: analysisText }); // ✅ Open Analysis Dialog
    } catch (err) {
      console.error("❌ Error analyzing image:", err);
      alert("Error analyzing image. Please try again.");
    } finally {
      setAnalyzingIndex(null);
      console.log("🔚 Finished analyzing image.");
    }
  };

  const handleLogout = () => {
    auth?.logout();
    localStorage.removeItem("token");
    console.log("🚪 User logged out.");
    navigate("/login");
  };

  return (
    <Container maxWidth="md" sx={{ textAlign: "center", marginTop: 5 }}>
      <Typography variant="h4">Welcome to Your Dashboard</Typography>

      {/* 🔹 File Upload Section */}
      <Box mt={3}>
        <Input
          type="file"
          onChange={(e) => setImage((e.target as HTMLInputElement).files?.[0] || null)}
          sx={{ marginBottom: 2 }}
        />
        <Button variant="contained" color="primary" onClick={handleUpload} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Upload Image"}
        </Button>
      </Box>

      {/* 🔹 Display Uploaded Images */}
      <Box mt={4} display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={2}>
        {imageList.map((img, index) => (
          <Card key={index} sx={{ position: "relative", padding: 2 }}>
            <CardMedia component="img" height="150" image={img.url} alt={`Uploaded ${index}`} />
            <CardActions>
              <Button
                startIcon={<AnalyticsIcon />}
                variant="outlined"
                onClick={() => handleAnalyze(img.url, index)}
                disabled={analyzingIndex === index}
              >
                {analyzingIndex === index ? "Analyzing..." : "Analyze"}
              </Button>
              <IconButton onClick={() => setZoomedImage(img.url)} title="Zoom">
                <ZoomInIcon />
              </IconButton>
            </CardActions>
          </Card>
        ))}
      </Box>

      {/* 🔹 Logout Button */}
      <Button variant="contained" color="secondary" onClick={handleLogout} sx={{ marginTop: 3 }}>
        Logout
      </Button>

      {/* 🔹 Zoom Dialog (ONLY ZOOM) */}
      <Dialog open={!!zoomedImage} onClose={() => setZoomedImage(null)} maxWidth="lg">
        <DialogContent sx={{ position: "relative", padding: 2 }}>
          <IconButton onClick={() => setZoomedImage(null)} sx={{ position: "absolute", top: 10, right: 10 }}>
            <CloseIcon />
          </IconButton>
          <img src={zoomedImage!} alt="Zoomed" style={{ maxWidth: "100%", maxHeight: "80vh", display: "block", margin: "auto" }} />
        </DialogContent>
      </Dialog>

      {/* 🔹 Analysis Dialog (ONLY ANALYSIS) */}
      <Dialog open={!!analyzedImage} onClose={() => setAnalyzedImage(null)} maxWidth="lg">
        <DialogContent sx={{ position: "relative", padding: 2 }}>
          <IconButton onClick={() => setAnalyzedImage(null)} sx={{ position: "absolute", top: 10, right: 10 }}>
            <CloseIcon />
          </IconButton>
          <img src={analyzedImage?.url} alt="Analyzed" style={{ maxWidth: "100%", maxHeight: "80vh", display: "block", margin: "auto" }} />
          <Typography variant="body1" sx={{ mt: 2, textAlign: "center", fontStyle: "italic", color: "gray" }}>
            {analyzedImage?.analysis}
          </Typography>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
