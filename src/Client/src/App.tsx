import { useEffect, useState } from 'react';
import { Box, CssBaseline, CircularProgress, Typography } from '@mui/material';
import { RobotService, ArmKinematicModels, DhParameters } from './services/RobotService';
import Sidebar from './components/Sidebar';
import Scene from './scene/Scene';

function App() {
  const [loading, setLoading] = useState(true);
  // Default joints (all zero)
  const [joints, setJoints] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [model, setModel] = useState<ArmKinematicModels>(ArmKinematicModels.CRX10iA);
  const [dhParameters, setDhParameters] = useState<DhParameters | null>(null);

  useEffect(() => {
    RobotService.init()
      .then(() => setLoading(false))
      .catch(err => console.error("Failed to init Blazor", err));
  }, []);

  useEffect(() => {
    if (!loading) {
      RobotService.getDhParameters(model).then(setDhParameters);
    }
  }, [loading, model]);

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
        model={model}
        onModelChange={setModel}
      />
      <Box sx={{ flexGrow: 1, position: 'relative', height: '100%' }}>
        <Scene
          joints={joints}
          onJointsChange={setJoints}
          model={model}
          dhParameters={dhParameters}
        />
      </Box>
    </Box>
  );
}

export default App;
