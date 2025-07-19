/**
 * src/components/insurance/insurance-tracker.tsx
 *
 * InsuranceTracker is a React component that displays and manages a list of insurance policies
 * for a given user. It allows users to view, add, edit, and delete their insurance policies.
 *
 * The component fetches insurance policies from the database using the InsuranceService,
 * and provides a user interface for managing these policies.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Stack,
  Box,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { InsuranceService } from '@/services/InsuranceService';
import type { DexieInsurancePolicyRecord as AppInsurance } from '@/db';
import { useAuth } from '@/contexts/AuthContext';

interface InsuranceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (policyData: Omit<AppInsurance, 'id'>) => void;
  initialValues?: Omit<AppInsurance, 'id'>;
  title: string;
}

const InsuranceForm: React.FC<InsuranceFormProps> = ({ open, onClose, onSubmit, initialValues, title }) => {
  const [policyName, setPolicyName] = useState(initialValues?.policyName || '');
  const [provider, setProvider] = useState(initialValues?.provider || '');
  const [policyNumber, setPolicyNumber] = useState(initialValues?.policyNumber || '');
  const [premium, setPremium] = useState(initialValues?.premium || '');
  const [coverageType, setCoverageType] = useState(initialValues?.coverageType || '');
  const [startDate, setStartDate] = useState<Dayjs | null>(initialValues?.startDate ? dayjs(initialValues.startDate) : null);
  const [endDate, setEndDate] = useState<Dayjs | null>(initialValues?.endDate ? dayjs(initialValues.endDate) : null);

  useEffect(() => {
    if (initialValues) {
      setPolicyName(initialValues.policyName || '');
      setProvider(initialValues.provider || '');
      setPolicyNumber(initialValues.policyNumber || '');
      setPremium(initialValues.premium || '');
      setCoverageType(initialValues.coverageType || '');
      setStartDate(initialValues.startDate ? dayjs(initialValues.startDate) : null);
      setEndDate(initialValues.endDate ? dayjs(initialValues.endDate) : null);
    }
  }, [initialValues]);

  const handleSubmit = () => {
    if (!policyName || !provider || !policyNumber || !premium || !coverageType || !startDate || !endDate) {
      alert('Please fill in all fields.');
      return;
    }

    const policyData: Omit<AppInsurance, 'id'> = {
      user_id: initialValues?.user_id || '', // Ensure user_id is passed, or set it appropriately
      policyName,
      provider,
      policyNumber,
      premium,
      coverageType,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    onSubmit(policyData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {title}
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
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Policy Name"
            fullWidth
            value={policyName}
            onChange={(e) => setPolicyName(e.target.value)}
            required
          />
          <TextField
            label="Provider"
            fullWidth
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            required
          />
          <TextField
            label="Policy Number"
            fullWidth
            value={policyNumber}
            onChange={(e) => setPolicyNumber(e.target.value)}
            required
          />
          <TextField
            label="Premium"
            fullWidth
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
            required
          />
          <FormControl fullWidth>
            <InputLabel id="coverage-type-label">Coverage Type</InputLabel>
            <Select
              labelId="coverage-type-label"
              id="coverage-type"
              value={coverageType}
              label="Coverage Type"
              onChange={(e) => setCoverageType(e.target.value)}
              required
            >
              <MenuItem value="Health">Health</MenuItem>
              <MenuItem value="Auto">Auto</MenuItem>
              <MenuItem value="Home">Home</MenuItem>
              <MenuItem value="Life">Life</MenuItem>
              <MenuItem value="Travel">Travel</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              renderInput={(params) => <TextField {...params} fullWidth required />}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => setEndDate(date)}
              renderInput={(params) => <TextField {...params} fullWidth required />}
            />
          </LocalizationProvider>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const InsuranceTracker: React.FC = () => {
  const [policies, setPolicies] = useState<AppInsurance[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<AppInsurance | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const { user } = useAuth();

  const userId = user?.uid || '';

  const fetchPolicies = useCallback(async () => {
    if (userId) {
      try {
        const fetchedPolicies = await InsuranceService.getPolicies(userId);
        setPolicies(fetchedPolicies);
      } catch (error) {
        console.error('Failed to fetch policies:', error);
        setSnackbarMessage('Failed to fetch policies.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleAddDialogOpen = () => {
    setAddDialogOpen(true);
  };

  const handleEditDialogOpen = (policy: AppInsurance) => {
    setSelectedPolicy(policy);
    setEditDialogOpen(true);
  };

  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedPolicy(null);
  };

  const handleAddPolicy = async (policyData: Omit<AppInsurance, 'id'>) => {
    try {
      await InsuranceService.addPolicy({ ...policyData, user_id: userId });
      setSnackbarMessage('Policy added successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchPolicies();
    } catch (error) {
      console.error('Failed to add policy:', error);
      setSnackbarMessage('Failed to add policy.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleUpdatePolicy = async (id: string, updates: Partial<AppInsurance>) => {
    try {
      await InsuranceService.updatePolicy(id, updates);
      setSnackbarMessage('Policy updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchPolicies();
    } catch (error) {
      console.error('Failed to update policy:', error);
      setSnackbarMessage('Failed to update policy.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    try {
      await InsuranceService.deletePolicy(id);
      setSnackbarMessage('Policy deleted successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      fetchPolicies();
    } catch (error) {
      console.error('Failed to delete policy:', error);
      setSnackbarMessage('Failed to delete policy.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2">
          Insurance Policies
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddDialogOpen}>
          Add Policy
        </Button>
      </Box>

      <InsuranceForm
        open={addDialogOpen}
        onClose={handleAddDialogClose}
        onSubmit={handleAddPolicy}
        title="Add Insurance Policy"
        initialValues={{
          user_id: userId,
          policyName: '',
          provider: '',
          policyNumber: '',
          premium: '',
          coverageType: '',
          startDate: new Date(),
          endDate: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        }}
      />

      <InsuranceForm
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        onSubmit={(updates) => {
          if (selectedPolicy) {
            handleUpdatePolicy(selectedPolicy.id, updates);
          }
        }}
        title="Edit Insurance Policy"
        initialValues={selectedPolicy || {
          user_id: userId,
          policyName: '',
          provider: '',
          policyNumber: '',
          premium: '',
          coverageType: '',
          startDate: new Date(),
          endDate: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        }}
      />

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {policies.map((policy) => (
        <Card key={policy.id} variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" component="div">
              {policy.policyName}
            </Typography>
            <Typography color="textSecondary">Provider: {policy.provider}</Typography>
            <Typography color="textSecondary">Policy Number: {policy.policyNumber}</Typography>
            <Typography color="textSecondary">Premium: {policy.premium}</Typography>
            <Typography color="textSecondary">Coverage Type: {policy.coverageType}</Typography>
            <Typography color="textSecondary">
              Start Date: {new Date(policy.startDate).toLocaleDateString()}
            </Typography>
            <Typography color="textSecondary">End Date: {new Date(policy.endDate).toLocaleDateString()}</Typography>
            <Box mt={2}>
              <IconButton aria-label="edit" onClick={() => handleEditDialogOpen(policy)}>
                <EditIcon />
              </IconButton>
              <IconButton aria-label="delete" onClick={() => handleDeletePolicy(policy.id)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InsuranceTracker;
