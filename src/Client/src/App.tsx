import { useEffect, useState } from 'react';
import { Box, CssBaseline, CircularProgress, Typography, ThemeProvider } from '@mui/material';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);

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

  const handleCloseInfo = () => {
    setInfoOpen(false);
    localStorage.setItem('fanuc_kinematics_info_seen', 'true');
  };

  const handleOpenInfo = () => {
    setInfoOpen(true);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="background.default">
          <CircularProgress />
          <Typography ml={2} variant="h6" color="text.primary">Initializing Fanuc Robot Logic...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        <CssBaseline />
        <Header
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
            />
          </Box>

          {/* Sidebar overlays the scene */}
          <Sidebar
            joints={joints}
            onJointsChange={setJoints}
            model={model}
            onModelChange={setModel}
            isOpen={sidebarOpen}
          />
        </Box>

        <InfoPopup open={infoOpen} onClose={handleCloseInfo} />
      </Box>
    </ThemeProvider>
  );
}

export default App;
