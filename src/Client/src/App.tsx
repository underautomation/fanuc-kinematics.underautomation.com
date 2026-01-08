import { useEffect, useState, useRef } from 'react';
import { Box, CssBaseline, ThemeProvider, useMediaQuery, useTheme } from '@mui/material';
import { RobotService, ArmKinematicModels } from './services/RobotService';
import type { DhParameters } from './services/RobotService';
import Sidebar from './components/Sidebar';
import Scene from './scene/Scene';
import Header from './components/Header';
import InfoPopup from './components/InfoPopup';
import { theme } from './theme';

function App() {
  const [loading, setLoading] = useState(true);
  // Default joints (all zero)
  const [joints, setJoints] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [model, setModel] = useState<ArmKinematicModels>(ArmKinematicModels.CRX10iA);
  const [dhParameters, setDhParameters] = useState<DhParameters | null>(null);

  // Layout State
  const themeObj = useTheme();
  // We can use a simple check for mobile, or MUI useMediaQuery
  const isMobile = useMediaQuery(themeObj.breakpoints.down('sm'));

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // Default closed on mobile
  const [infoOpen, setInfoOpen] = useState(false);

  // Peek animation state
  const [isPeeking, setIsPeeking] = useState(false);
  const hasPeeked = useRef(false);

  // Preview state for Ghost Robot
  const [previewJoints, setPreviewJoints] = useState<number[] | null>(null);

  useEffect(() => {
    // Logic to handle initial mobile state if screen changes (optional, but good for resizing)
    // If we want it strictly "on arrival", relying on initial useState is fine.
  }, [isMobile]);

  useEffect(() => {
    RobotService.init()
      .then(() => setLoading(false))
      .catch(err => console.error("Failed to init Blazor", err));

    // Check if info has been seen
    const seen = localStorage.getItem('fanuc_kinematics_info_seen');
    if (!seen) {
      setInfoOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      RobotService.getDhParameters(model).then(setDhParameters);
    }
  }, [loading, model]);

  // Mobile Peek Logic
  useEffect(() => {
    // Only run on mobile, if sidebar is closed, and we haven't peeked yet
    if (isMobile && !sidebarOpen && !infoOpen && !hasPeeked.current && !loading) {
      const timer = setTimeout(() => {
        setIsPeeking(true);
        hasPeeked.current = true;
        // Hide peek after small delay
        setTimeout(() => {
          setIsPeeking(false);
        }, 700); // 700ms visibility
      }, 2000); // 2s delay after arrival/popup close

      return () => clearTimeout(timer);
    }
  }, [isMobile, sidebarOpen, infoOpen, loading]);


  const handleCloseInfo = () => {
    setInfoOpen(false);
    localStorage.setItem('fanuc_kinematics_info_seen', 'true');
  };

  const handleOpenInfo = () => {
    setInfoOpen(true);
  };



  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <CssBaseline />
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenInfo={handleOpenInfo}
        />

        <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Scene takes up the full space behind everything */}
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
            <Scene
              joints={joints}
              onJointsChange={setJoints}
              model={model}
              dhParameters={dhParameters}
              previewJoints={previewJoints}
            />
          </Box>

          {/* Sidebar overlays the scene */}
          <Sidebar
            joints={joints}
            onJointsChange={setJoints}
            onPreviewJoints={setPreviewJoints}
            model={model}
            onModelChange={setModel}
            isOpen={sidebarOpen}
            isPeeking={isPeeking}
            isReady={!loading}
          />
        </Box>

        <InfoPopup open={infoOpen} onClose={handleCloseInfo} />
      </Box>
    </ThemeProvider>
  );
}

export default App;
