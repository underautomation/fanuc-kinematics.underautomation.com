import { AppBar, Toolbar, Typography, IconButton, Box, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import InfoIcon from '@mui/icons-material/Info';
import GitHubIcon from '@mui/icons-material/GitHub';

interface HeaderProps {
    onToggleSidebar: () => void;
    onOpenInfo: () => void;
}

export default function Header({ onToggleSidebar, onOpenInfo }: HeaderProps) {
    return (
        <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={onToggleSidebar}
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>

                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Fanuc CRX Inverse Kinematics
                </Typography>

                <Box>
                    <Tooltip title="Information">
                        <IconButton color="inherit" onClick={onOpenInfo}>
                            <InfoIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="View on GitHub">
                        <IconButton
                            color="inherit"
                            href="https://github.com/underautomation/Fanuc.NET"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <GitHubIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
