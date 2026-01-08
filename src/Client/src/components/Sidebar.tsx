import { Box, Paper, Slider, TextField, Typography, Button, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState, useEffect, useCallback } from 'react';
import { RobotService, WristFlip, ArmUpDown, ArmLeftRight, ArmFrontBack, ArmKinematicModels } from '../services/RobotService';
import type { FkResult, Joints } from '../services/RobotService';

interface SidebarProps {
    joints: number[];
    onJointsChange: (j: number[]) => void;
    model: ArmKinematicModels;
    onModelChange: (m: ArmKinematicModels) => void;
    isOpen: boolean;
    isPeeking?: boolean;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;

export default function Sidebar({ joints, onJointsChange, model, onModelChange, isOpen, isPeeking = false }: SidebarProps) {
    const [cartesian, setCartesian] = useState({ x: 400, y: 0, z: 400, w: 180, p: 0, r: 0 });
    const [fkResult, setFkResult] = useState<FkResult | null>(null);
    const [ikSolutions, setIkSolutions] = useState<Joints[]>([]);

    // Resize state
    const [width, setWidth] = useState(360);
    const [isResizing, setIsResizing] = useState(false);

    // Joint Limits (approx for generic 6-axis)
    const limits = [-170, 170];

    // Calculate FK when joints change
    useEffect(() => {
        let active = true;
        const calc = async () => {
            const res = await RobotService.calculateFK(joints, model);
            if (active && res) {
                setFkResult(res);
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
    }, [joints, model]);

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
            cartesian.w, cartesian.p, cartesian.r, model
        );
        setIkSolutions(result);
    };

    const applySolution = (sol: Joints) => {
        onJointsChange(sol);
    };

    // Helper to get Enum string
    const getEnumName = (obj: any, val: number) => Object.keys(obj).find(k => obj[k] === val) || 'Unknown';

    // Resize handlers
    const startResizing = useCallback(() => setIsResizing(true), []);
    const stopResizing = useCallback(() => setIsResizing(false), []);
    const resize = useCallback((mouseMoveEvent: any) => {
        if (isResizing) {
            const newWidth = mouseMoveEvent.clientX;
            if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
                setWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    // Close sidebar logic - instead of unmounting, we animate width to 0
    // But we need to keep rendering it to animate.
    // Peek logic: show 80px (approx 20% of smallest mobile) or 20% width?
    // Let's go with fixed small width for peek to suggest "there is something".
    const getEffectiveWidth = () => {
        if (isOpen) return width;
        if (isPeeking) return MAX_WIDTH; // Just enough to see edge/color
        return 0;
    };

    const effectiveWidth = getEffectiveWidth();

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 10,
                width: effectiveWidth,
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth ease-in-out
                overflow: 'hidden', // Hide content when collapsed
                display: 'flex',
                // Ensure clicks don't pass through
                pointerEvents: isOpen ? 'auto' : 'none',
                userSelect: 'none', // Prevent text selection during resize
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: width, // Inner content keeps full width so it doesn't squash, just clips
                    height: '100%',
                    p: 2,
                    overflowY: 'auto',
                    // Transparency styles - using theme alpha
                    bgcolor: (theme) => alpha(theme.palette.background.paper, 0.7),
                    backdropFilter: 'blur(12px)',
                    borderRight: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                    boxShadow: '4px 0 24px rgba(0,0,0,0.2)', // Slightly stronger shadow for depth
                    flexShrink: 0,
                    borderRadius: 0,
                }}
            >
                {/* Title removed for density */}

                <FormControl fullWidth size="small" sx={{ mb: 1, mt: 1 }}>
                    <InputLabel>Robot Model</InputLabel>
                    <Select
                        value={model}
                        label="Robot Model"
                        onChange={(e) => onModelChange(Number(e.target.value) as ArmKinematicModels)}
                    >
                        <MenuItem value={ArmKinematicModels.CRX10iA}>CRX-10iA (Short)</MenuItem>
                        <MenuItem value={ArmKinematicModels.CRX10iAL}>CRX-10iA/L (Long)</MenuItem>
                    </Select>
                </FormControl>

                <Divider sx={{ my: 1 }}>Joints (FK)</Divider>
                {joints.map((j, i) => (
                    <Box key={i} mb={0.5} display="flex" alignItems="center">
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
                    <Box sx={{ mt: 1, p: 1, bgcolor: (theme) => alpha(theme.palette.action.hover, 0.1), borderRadius: 1 }}>
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
                                InputProps={{ style: { fontSize: 13 } }}
                            // Theme handles input bg
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
                        <TableContainer component={Paper} sx={{ maxHeight: 200, mt: 1, bgcolor: 'transparent', boxShadow: 'none' }}>
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
            {/* Resize Handle */}
            <Box
                onMouseDown={startResizing}
                sx={{
                    width: 5,
                    cursor: 'col-resize',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 20,
                    backgroundColor: isResizing ? 'primary.main' : 'transparent',
                    '&:hover': {
                        backgroundColor: 'primary.light',
                    },
                    display: isOpen ? 'block' : 'none'
                }}
            />
        </Box>
    );
}
