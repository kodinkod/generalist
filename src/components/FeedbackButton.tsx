import { useState } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Feedback as FeedbackIcon } from '@mui/icons-material';
import { feedbackApi } from '../services/dataService';

const FeedbackButton = () => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'feature' | 'general' | 'rating'>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setOpen(true);
    setSuccess(false);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setType('general');
    setMessage('');
  };

  const handleTypeChange = (event: SelectChangeEvent) => {
    setType(event.target.value as 'bug' | 'feature' | 'general' | 'rating');
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await feedbackApi.submit({
        userId: '', // Will be set by the API
        type,
        message: message.trim(),
      });

      setSuccess(true);
      setMessage('');

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="feedback"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <FeedbackIcon />
      </Fab>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Send Feedback</DialogTitle>
        <DialogContent>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Thank you for your feedback!
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Feedback Type</InputLabel>
              <Select
                value={type}
                onChange={handleTypeChange}
                label="Feedback Type"
                disabled={isSubmitting}
              >
                <MenuItem value="general">General Feedback</MenuItem>
                <MenuItem value="feature">Feature Request</MenuItem>
                <MenuItem value="bug">Bug Report</MenuItem>
                <MenuItem value="rating">Rating Feedback</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Your Message"
              multiline
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              placeholder="Tell us what you think..."
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FeedbackButton;
