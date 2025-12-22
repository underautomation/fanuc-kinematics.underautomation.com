import { Box, Paper, Slider, TextField, Typography, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useState, useEffect } from 'react';
import { RobotService, WristFlip, ArmUpDown, ArmLeftRight, ArmFrontBack } from '../services/RobotService';
import type { FkResult, Joints } from '../services/RobotService';

interface SidebarProps {
    joints: number[];
    onJointsChange: (j: number[]) => void;
}

export default function Sidebar({ joints, onJointsChange }: SidebarProps) {
    const [cartesian, setCartesian] = useState({ x: 400, y: 0, z: 400, w: 180, p: 0, r: 0 });
    const [fkResult, setFkResult] = useState<FkResult | null>(null);
    const [ikSolutions, setIkSolutions] = useState<Joints[]>([]);

    // Joint Limits (approx for generic 6-axis)
    const limits = [-170, 170];

    // Calculate FK when joints change
    useEffect(() => {
        let active = true;
        const calc = async () => {
            const res = await RobotService.calculateFK(joints);
            if (active && res) {
                setFkResult(res);
                // Also update the cartesian inputs to match current robot position? 
                // Maybe better to keep them separate or sync them specific times. 
                // For now, let's just display the FK result separately or update the textfields? 
                // The prompt says "Affiche... à côté du TextFiels correspondant". 
                // I'll update the textfields to match current position to keep it in sync.
                setCartesian({
                    x: Number(res.x.toFixed(2)),
                    y: Number(res.y.toFixed(2)),
                    z: Number(res.z.toFixed(2)),
                    w: Number(res.w.toFixed(2)),
                    p: Number(res.p.toFixed(2)),
                    r: Number(res.r.toFixed(2))
                });
            }
        };
        calc();
        return () => { active = false; };
    }, [joints]);

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
        setIkSolutions(result);
        if (result.length > 0) {
            // Automatically pick the first one? Or just show table? 
            // Prompt says "optimize... pick first one" in old code, now "table... select".
            // So we just show table.
        }
    };

    const applySolution = (sol: Joints) => {
        onJointsChange(sol);
    };

    // Helper to get Enum string
    const getEnumName = (obj: any, val: number) => Object.keys(obj).find(k => obj[k] === val) || 'Unknown';

    return (
        <Paper sx={{ width: 360, p: 2, height: '100%', overflowY: 'auto', zIndex: 10 }}>
            <Typography variant="h6" gutterBottom>Fanuc Control</Typography>

            <Divider sx={{ my: 2 }}>Joints (FK)</Divider>
            {joints.map((j, i) => (
                <Box key={i} mb={1} display="flex" alignItems="center">
                    <Typography variant="caption" sx={{ width: 40 }}>J{i + 1}</Typography>
                    <Slider
                        size="small"
                        min={limits[0]} max={limits[1]}
                        value={j}
                        onChange={(_, v) => handleSliderChange(i, v)}
                        sx={{ flexGrow: 1, mx: 1 }}
                    />
                    <Typography variant="caption" sx={{ width: 40, textAlign: 'right' }}>{j.toFixed(0)}°</Typography>
                </Box>
            ))}

            {fkResult && fkResult.configuration && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="caption" display="block">
                        <b>Config:</b> {fkResult.configuration.configString}
                    </Typography>
                    <Typography variant="caption" display="block">
                        {getEnumName(WristFlip, fkResult.configuration.wristFlip)} {getEnumName(ArmUpDown, fkResult.configuration.armUpDown)} {getEnumName(ArmLeftRight, fkResult.configuration.armLeftRight)} {getEnumName(ArmFrontBack, fkResult.configuration.armFrontBack)}
                    </Typography>
                    <Typography variant="caption" display="block">
                        Turns: {fkResult.configuration.turnAxis4}, {fkResult.configuration.turnAxis5}, {fkResult.configuration.turnAxis6}
                    </Typography>
                </Box>
            )}

            <Divider sx={{ my: 2 }}>Cartesian (IK)</Divider>
            <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={1}>
                {Object.entries(cartesian).map(([key, val]) => (
                    <Box key={key}>
                        <TextField
                            label={key.toUpperCase()}
                            value={val}
                            onChange={(e) => handleCartesianChange(key, e.target.value)}
                            size="small"
                            type="number"
                            fullWidth
                            InputProps={{ style: { fontSize: 12 } }}
                        />
                    </Box>
                ))}
            </Box>
            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={solveIK}>
                Solve IK
            </Button>

            {ikSolutions.length > 0 && (
                <Box mt={2}>
                    <Typography variant="subtitle2">Solutions ({ikSolutions.length})</Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 200, mt: 1 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Sol</TableCell>
                                    <TableCell>J1</TableCell>
                                    <TableCell>J2</TableCell>
                                    <TableCell>J3</TableCell>
                                    <TableCell>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ikSolutions.map((sol, idx) => (
                                    <TableRow key={idx} hover>
                                        <TableCell>{idx + 1}</TableCell>
                                        <TableCell>{sol[0].toFixed(0)}</TableCell>
                                        <TableCell>{sol[1].toFixed(0)}</TableCell>
                                        <TableCell>{sol[2].toFixed(0)}</TableCell>
                                        <TableCell>
                                            <Button size="small" variant="outlined" onClick={() => applySolution(sol)}>
                                                Set
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
        </Paper>
    );
}
