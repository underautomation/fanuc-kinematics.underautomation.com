import { Box, Paper, Slider, Typography, Divider, Select, MenuItem, InputLabel, FormControl, Chip, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { RobotService, WristFlip, ArmUpDown, ArmLeftRight, ArmFrontBack, ArmKinematicModels } from '../services/RobotService';
import type { FkResult } from '../services/RobotService';
import NumberInput from './NumberInput';
import { KinematicsHelper, type SolutionWithConfig } from '../services/KinematicsHelper';

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
    const [ikSolutions, setIkSolutions] = useState<SolutionWithConfig[]>([]);

    // Track if user is actively editing Cartesian inputs to avoid overwriting their work with FK updates
    const [isEditingCartesian, setIsEditingCartesian] = useState(false);

    // Resize state
    const [width, setWidth] = useState(360);
    const [isResizing, setIsResizing] = useState(false);

    // Joint Limits (approx for generic 6-axis)
    const limits = [-170, 170];

    // Debounced kinematics calculation (FK + All IK Solutions)
    const debouncedCalc = useMemo(
        () => debounce(async (currJoints: number[], currModel: ArmKinematicModels, editing: boolean) => {
            // 1. Calculate FK
            const res = await RobotService.calculateFK(currJoints, currModel);
            if (!res) return;

            setFkResult(res);

            // Update Cartesian display if not editing
            if (!editing) {
                setCartesian({
                    x: Number(res.x.toFixed(2)),
                    y: Number(res.y.toFixed(2)),
                    z: Number(res.z.toFixed(2)),
                    w: Number(res.w.toFixed(2)),
                    p: Number(res.p.toFixed(2)),
                    r: Number(res.r.toFixed(2))
                });
            }

            // 2. Calculate All IK Solutions (for Config list) based on the CURRENT FK Position
            const solutions = await KinematicsHelper.getSolutionsWithConfigs(res, currModel);
            setIkSolutions(solutions);

        }, 250),
        []
    );

    // Trigger calculation when joints/model change
    useEffect(() => {
        debouncedCalc(joints, model, isEditingCartesian);
        return () => {
            // Optional: debouncedCalc.cancel(); 
        };
    }, [joints, model, isEditingCartesian, debouncedCalc]);

    // When Cartesian values change (from input), solve IK and update best solution
    const updateRobotFromCartesian = async (target: typeof cartesian) => {
        // Move robot to best solution (closest)
        const best = await KinematicsHelper.findBestJoints(target, joints, model);
        if (best) {
            onJointsChange(best);
        }
        // Note: We do NOT explicitly calculate IK solutions here update `ikSolutions`.
        // The `onJointsChange` will update `joints`, which triggers the `useEffect(debouncedCalc)` above.
        // This keeps the logic centralized.
    };

    const handleCartesianChange = (key: string, val: number) => {
        const newCartesian = { ...cartesian, [key]: val };
        setCartesian(newCartesian);
        updateRobotFromCartesian(newCartesian);
    };

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

    const getEffectiveWidth = () => {
        if (isOpen) return width;
        if (isPeeking) return MAX_WIDTH;
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
                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                display: 'flex',
                pointerEvents: isOpen ? 'auto' : 'none',
                userSelect: 'none',
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: width,
                    height: '100%',
                    p: 2,
                    overflowY: 'auto',
                    bgcolor: (theme) => alpha(theme.palette.background.paper, 0.7),
                    backdropFilter: 'blur(12px)',
                    borderRight: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                    boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
                    flexShrink: 0,
                    borderRadius: 0,
                }}
            >
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
                            onChange={(_, v) => onJointsChange([...joints.slice(0, i), v as number, ...joints.slice(i + 1)])} // Direct update
                            sx={{ flexGrow: 1, mx: 1 }}
                        />
                        <Typography variant="caption" sx={{ width: 40, textAlign: 'right' }}>{j.toFixed(0)}°</Typography>
                    </Box>
                ))}

                {fkResult && fkResult.configuration && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: (theme) => alpha(theme.palette.action.hover, 0.1), borderRadius: 1 }}>
                        <Typography variant="caption" display="block">
                            <b>Current Config:</b> {fkResult.configuration.configString}
                        </Typography>
                    </Box>
                )}

                <Divider sx={{ my: 2 }}>Cartesian (IK)</Divider>
                <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={1}>
                    {Object.entries(cartesian).map(([key, val]) => (
                        <Box key={key}>
                            <NumberInput
                                label={key.toUpperCase()}
                                value={val}
                                onChange={(newVal) => handleCartesianChange(key, newVal)}
                                onFocus={() => setIsEditingCartesian(true)}
                                onBlur={() => setIsEditingCartesian(false)}
                                size="small"
                                fullWidth
                                InputProps={{ style: { fontSize: 13 } }}
                            />
                        </Box>
                    ))}
                </Box>

                {ikSolutions.length > 0 && (
                    <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>Configuration Solutions</Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {ikSolutions.map((sol, idx) => (
                                <Chip
                                    key={idx}
                                    label={sol.configString}
                                    onClick={() => onJointsChange(sol.joints)}
                                    color={fkResult?.configuration.configString === sol.configString ? "primary" : "default"}
                                    variant={fkResult?.configuration.configString === sol.configString ? "filled" : "outlined"}
                                    clickable
                                />
                            ))}
                        </Stack>
                    </Box>
                )}
            </Paper>
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
