import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReactMarkdown from 'react-markdown';
import readmePath from '../../../../README.md?raw'; // Vite allows importing text files with ?raw

interface InfoPopupProps {
    open: boolean;
    onClose: () => void;
}

const STORAGE_KEY = 'fanuc_kinematics_info_seen';

export default function InfoPopup({ open, onClose }: InfoPopupProps) {

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="lg"
            scroll="paper"
        >
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Fanuc Robot Simulator Info
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
