import { Box, Paper, Slider, TextField, Typography, Button, Divider, Grid } from '@mui/material';
import { useState } from 'react';
import { RobotService } from '../services/RobotService';

interface SidebarProps {
    joints: number[];
    onJointsChange: (j: number[]) => void;
}

export default function Sidebar({ joints, onJointsChange }: SidebarProps) {
    const [cartesian, setCartesian] = useState({ x: 400, y: 0, z: 400, w: 180, p: 0, r: 0 });

    // Joint Limits (approx for generic 6-axis)
    const limits = [-170, 170];

    const handleSliderChange = (idx: number, val: number | number[]) => {
        const newJoints = [...joints];
        newJoints[idx] = val as number;
        onJointsChange(newJoints);
    };

    const handleCartesianChange = (key: string, val: string) => {
        setCartesian({ ...cartesian, [key]: parseFloat(val) || 0 });
    };

    const solveIK = async () => {
        const result = await RobotService.calculateIK(
            cartesian.x, cartesian.y, cartesian.z,
            cartesian.w, cartesian.p, cartesian.r
        );
        onJointsChange(result);
    };

    return (
        <Paper sx={{ width: 320, p: 2, overflowY: 'auto', zIndex: 10 }}>
            <Typography variant="h6" gutterBottom>Fanuc Control</Typography>

            <Divider sx={{ my: 2 }}>Joints (FK)</Divider>
            {joints.map((j, i) => (
                <Box key={i} mb={1}>
                    <Typography variant="caption">J{i + 1}: {j.toFixed(1)}°</Typography>
                    <Slider
                        size="small"
                        min={limits[0]} max={limits[1]}
                        value={j}
                        onChange={(_, v) => handleSliderChange(i, v)}
                    />
                </Box>
            ))}

            <Divider sx={{ my: 2 }}>Cartesian (IK)</Divider>
            <Grid container spacing={1}>
                {Object.entries(cartesian).map(([key, val]) => (
                    <Grid item xs={6} key={key}>
                        <TextField
                            label={key.toUpperCase()}
                            value={val}
                            onChange={(e) => handleCartesianChange(key, e.target.value)}
                            size="small"
                            type="number"
                            fullWidth
                        />
                    </Grid>
                ))}
            </Grid>
            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={solveIK}>
                Solve IK
            </Button>
        </Paper>
    );
}
