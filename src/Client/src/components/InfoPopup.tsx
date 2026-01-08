import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Slide } from '@mui/material';
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

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="lg"
            scroll="paper"
            slots={{
                transition: Transition,
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2 }}>
                About this project
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
            <DialogContent dividers>
                <ReactMarkdown>{readmePath}</ReactMarkdown>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} autoFocus>
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
}
