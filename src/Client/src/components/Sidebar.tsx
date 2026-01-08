import { Box, Paper, Slider, Typography, Divider, Select, MenuItem, InputLabel, FormControl, Chip, Stack, CircularProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { RobotService, ArmKinematicModels } from '../services/RobotService';
import type { FkResult } from '../services/RobotService';
import NumberInput from './NumberInput';
import { KinematicsHelper, type SolutionWithConfig } from '../services/KinematicsHelper';

interface SidebarProps {
    joints: number[];
    onJointsChange: (j: number[]) => void;
    onPreviewJoints: (j: number[] | null) => void;
    model: ArmKinematicModels;
    onModelChange: (m: ArmKinematicModels) => void;
    isOpen: boolean;
    isPeeking?: boolean;
    isReady?: boolean; // New prop
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;

export default function Sidebar({ joints, onJointsChange, onPreviewJoints, model, onModelChange, isOpen, isPeeking = false, isReady = true }: SidebarProps) {
    const [cartesian, setCartesian] = useState({ x: 400, y: 0, z: 400, w: 180, p: 0, r: 0 });
    const [fkResult, setFkResult] = useState<FkResult | null>(null);
    const [ikSolutions, setIkSolutions] = useState<SolutionWithConfig[]>([]);

    // Track if user is actively editing Cartesian inputs to avoid overwriting their work with FK updates
    const [isEditingCartesian, setIsEditingCartesian] = useState(false);

    // Track slider dragging for Ghost Preview
    const [draggingJoints, setDraggingJoints] = useState<number[] | null>(null);

    // Resize state
    const [width, setWidth] = useState(360);
    const [isResizing, setIsResizing] = useState(false);

    // Joint Limits (approx for generic 6-axis)
    const limits = [-170, 170];

    // Debounced kinematics calculation (FK + All IK Solutions)
    const debouncedCalc = useMemo(
        () => debounce(async (currJoints: number[], currModel: ArmKinematicModels, editing: boolean, ready: boolean) => {
            if (!ready) return; // Skip if not ready

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

    // Trigger calculation when joints/model change (or when dragging)
    const effectiveJoints = draggingJoints || joints;
    useEffect(() => {
        debouncedCalc(effectiveJoints, model, isEditingCartesian, isReady);
        return () => {
            // Optional: debouncedCalc.cancel(); 
        };
    }, [effectiveJoints, model, isEditingCartesian, isReady, debouncedCalc]);

    // When Cartesian values change (from input), solve IK and update best solution
    const updateRobotFromCartesian = async (target: typeof cartesian) => {
        if (!isReady) return; // Prevent updates if not ready

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
                    position: 'relative' // For overlay
                }}
            >
                {!isReady && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 50,
                            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            p: 2
                        }}
                    >
                        <CircularProgress size={24} sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Initializing...
                        </Typography>
                        <Typography variant="caption" color="text.secondary" align="center">
                            Kinematics Engine Loading
                        </Typography>
                    </Box>
                )}

                <FormControl fullWidth size="small" sx={{ mb: 1 }} disabled={!isReady}>
                    <InputLabel>Robot Model</InputLabel>
                    <Select
                        value={model}
                        label="Robot Model"
                        onChange={(e) => onModelChange(Number(e.target.value) as ArmKinematicModels)}
                    >
                        <MenuItem value={ArmKinematicModels.CRX10iA}>CRX-10iA (Standard)</MenuItem>
                        <MenuItem value={ArmKinematicModels.CRX10iAL}>CRX-10iAL (Long)</MenuItem>
                    </Select>
                </FormControl>

                <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.1)' }} />

                <Typography variant="overline" display="block" color="text.secondary" fontWeight="bold" gutterBottom>
                    Joint Controls
                </Typography>
                <Box sx={{ opacity: isReady ? 1 : 0.5, pointerEvents: isReady ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                    {joints.map((val, idx) => {
                        const currentVal = draggingJoints ? draggingJoints[idx] : val;
                        return (
                            <Box key={idx} mb={0.5} display="flex" alignItems="center" sx={{ height: 28 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ width: 30, fontWeight: 500 }}>J{idx + 1}</Typography>
                                <Slider
                                    value={currentVal}
                                    min={limits[0]}
                                    max={limits[1]}
                                    step={0.1}
                                    onChange={(_, v) => {
                                        const newJoints = [...(draggingJoints || joints)];
                                        newJoints[idx] = v as number;
                                        setDraggingJoints(newJoints);
                                        onPreviewJoints(newJoints);
                                    }}
                                    onChangeCommitted={(_, v) => {
                                        const newJoints = [...(draggingJoints || joints)];
                                        newJoints[idx] = v as number;
                                        setDraggingJoints(null);
                                        onPreviewJoints(null);
                                        onJointsChange(newJoints);
                                    }}
                                    size="small"
                                    sx={{ mx: 1.5, flexGrow: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ width: 40, textAlign: 'right', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                    {currentVal.toFixed(0)}°
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>

                <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.1)' }} />

                <Typography variant="overline" display="block" color="text.secondary" fontWeight="bold" gutterBottom>
                    Cartesian Target
                </Typography>
                <Stack spacing={1} mb={2} sx={{ opacity: isReady ? 1 : 0.5, pointerEvents: isReady ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
                    <Stack direction="row" spacing={1}>
                        <NumberInput label="X" value={cartesian.x} onChange={(v) => handleCartesianChange('x', v)} onFocus={() => setIsEditingCartesian(true)} onBlur={() => setIsEditingCartesian(false)} />
                        <NumberInput label="Y" value={cartesian.y} onChange={(v) => handleCartesianChange('y', v)} onFocus={() => setIsEditingCartesian(true)} onBlur={() => setIsEditingCartesian(false)} />
                        <NumberInput label="Z" value={cartesian.z} onChange={(v) => handleCartesianChange('z', v)} onFocus={() => setIsEditingCartesian(true)} onBlur={() => setIsEditingCartesian(false)} />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <NumberInput label="W" value={cartesian.w} onChange={(v) => handleCartesianChange('w', v)} onFocus={() => setIsEditingCartesian(true)} onBlur={() => setIsEditingCartesian(false)} />
                        <NumberInput label="P" value={cartesian.p} onChange={(v) => handleCartesianChange('p', v)} onFocus={() => setIsEditingCartesian(true)} onBlur={() => setIsEditingCartesian(false)} />
                        <NumberInput label="R" value={cartesian.r} onChange={(v) => handleCartesianChange('r', v)} onFocus={() => setIsEditingCartesian(true)} onBlur={() => setIsEditingCartesian(false)} />
                    </Stack>
                </Stack>

                {fkResult && fkResult.configuration && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: (theme) => alpha(theme.palette.action.hover, 0.1), borderRadius: 1 }}>
                        <Typography variant="caption" display="block">
                            <b>Current Config:</b> {fkResult.configuration.configString}
                        </Typography>
                    </Box>
                )}

                {ikSolutions.length > 0 && (
                    <Box mt={3}>
                        <Typography variant="overline" display="block" color="text.secondary" fontWeight="bold" gutterBottom>
                            Available Solutions
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {ikSolutions.map((sol, idx) => (
                                <Chip
                                    key={idx}
                                    label={sol.configString}
                                    onClick={() => onJointsChange(sol.joints)}
                                    color={fkResult?.configuration.configString === sol.configString ? "primary" : "default"}
                                    variant={fkResult?.configuration.configString === sol.configString ? "filled" : "outlined"}
                                    clickable
                                    onMouseEnter={() => onPreviewJoints(sol.joints)}
                                    onMouseLeave={() => onPreviewJoints(null)}
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
