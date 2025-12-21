import { useEffect, useState } from 'react';
import { Box, CssBaseline, CircularProgress, Typography } from '@mui/material';
import { RobotService } from './services/RobotService';
import Sidebar from './components/Sidebar';
import Scene from './scene/Scene';

function App() {
  const [loading, setLoading] = useState(true);
  // Default joints (all zero)
  const [joints, setJoints] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    RobotService.init()
      .then(() => setLoading(false))
      .catch(err => console.error("Failed to init Blazor", err));
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography ml={2} variant="h6">Initializing Fanuc Robot Logic...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <CssBaseline />
      <Sidebar
        joints={joints}
        onJointsChange={setJoints}
      />
      <Box sx={{ flexGrow: 1, position: 'relative', height: '100%' }}>
        <Scene
          joints={joints}
          onJointsChange={setJoints}
        />
      </Box>
    </Box>
  );
}

export default App;
