import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Slide, useTheme, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReactMarkdown from 'react-markdown';
import readmePath from '../../../../README.md?raw'; // Vite allows importing text files with ?raw
import type { TransitionProps } from '@mui/material/transitions';
import React from 'react';

interface InfoPopupProps {
    open: boolean;
    onClose: () => void;
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="down" ref={ref} {...props} />;
});

export default function InfoPopup({ open, onClose }: InfoPopupProps) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={fullScreen}
            fullWidth
            maxWidth="lg"
            scroll="paper"
            slots={{
                transition: Transition,
            }}
        >
            <DialogTitle>
                Fanuc Cobot Kinematics Playground
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 1 }}>
                <ReactMarkdown
                    components={{
                        img: (props) => (
                            <img
                                {...props}
                                style={{
                                    maxWidth: '100%',
                                    display: 'block',
                                    margin: '0 auto'
                                }}
                            />
                        ),
                        h1: () => null,
                    }}
                >
                    {readmePath}
                </ReactMarkdown>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} autoFocus>
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
}
