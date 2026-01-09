import { AppBar, Toolbar, Typography, IconButton, Box, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import GitHubIcon from '@mui/icons-material/GitHub';

interface HeaderProps {
    onToggleSidebar: () => void;
    onOpenInfo: () => void;
    sidebarOpen: boolean;
}

export default function Header({ onToggleSidebar, onOpenInfo, sidebarOpen }: HeaderProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar sx={{ justifyContent: 'space-between', minHeight: isMobile ? 56 : 64 }}>
                {/* Left: Sidebar Toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <Tooltip title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}>
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={onToggleSidebar}
                            sx={{ mr: 1 }}
                        >
                            {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Center: Application Title */}
                <Box sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 1,
                    overflow: 'hidden'
                }}>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            textAlign: 'center',
                            fontSize: isMobile ? '0.9rem' : '1.25rem',
                            lineHeight: 1.1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        Fanuc Cobot Kinematics Playground
                    </Typography>
                </Box>

                {/* Right: Branding & Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
                    <Box
                        component="a"
                        href="https://underautomation.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:hover': { opacity: 0.8 }
                        }}
                    >
                        {!isMobile && (
                            <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary', fontWeight: 500 }}>
                                UnderAutomation
                            </Typography>
                        )}

                        <Box
                            component="img"
                            src="/UA-Small-Wh.png"
                            alt="UA Logo"
                            sx={{
                                height: 32,
                                display: 'block'
                            }}
                        />
                    </Box>

                    <Tooltip title="Information">
                        <IconButton color="inherit" onClick={onOpenInfo} sx={{ ml: 0.5 }}>
                            <InfoIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="View on GitHub">
                        <IconButton
                            color="inherit"
                            href="https://github.com/underautomation/fanuc-kinematics.underautomation.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ ml: 0.5 }}
                        >
                            <GitHubIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
