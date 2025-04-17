import { Router } from 'express';
import { db } from '../db-config';
import { featureFlags } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sendSentryNotification } from '../utils/sentry';

const router = Router();

// Get all feature flags
router.get('/', async (req, res) => {
  try {
    const flags = await db.select().from(featureFlags);
    const flagsMap = flags.reduce((acc: Record<string, boolean>, flag) => {
      acc[flag.name] = flag.value;
      return acc;
    }, {});
    res.json(flagsMap);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});

// Update a single feature flag
router.patch('/defaults/:flagName', async (req, res) => {
  const { flagName } = req.params;
  const { value } = req.body;
  const { userId, userType } = req.body;

  if (typeof value !== 'boolean') {
    return res.status(400).json({ error: 'Value must be a boolean' });
  }

  try {
    // Get current flag value
    const currentFlag = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.name, flagName))
      .limit(1);

    if (currentFlag.length === 0) {
      return res.status(404).json({ error: `Flag '${flagName}' not found` });
    }

    const currentValue = currentFlag[0].value;
    if (currentValue === value) {
      return res.status(200).json({ message: 'Flag value unchanged' });
    }

    // Update flag
    await db
      .update(featureFlags)
      .set({ 
        value,
        last_updated_by: userId || 'admin-menu@hoopshop.app',
        last_updated_at: new Date()
      })
      .where(eq(featureFlags.name, flagName));

    // Send Sentry notification
    await sendSentryNotification(flagName, 'updated', userId, userType);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({ error: 'Failed to update feature flag' });
  }
});

// Get flag descriptions
router.get('/descriptions', async (req, res) => {
  try {
    const flags = await db.select({
      name: featureFlags.name,
      description: featureFlags.description
    }).from(featureFlags);
    res.json(flags);
  } catch (error) {
    console.error('Error fetching flag descriptions:', error);
    res.status(500).json({ error: 'Failed to fetch flag descriptions' });
  }
});

// Handle local override notifications
router.post('/notify-flag-change', async (req, res) => {
  const { flagName, action, userId, userType } = req.body;

  if (!flagName || !action || !userId || !userType) {
    return res.status(400).json({ error: 'Missing required fields for override notification' });
  }

  try {
    const result = await sendSentryNotification(flagName, action, userId, userType);
    if (!result) {
      return res.status(500).json({ error: 'Failed to send Sentry notification' });
    }
    res.status(201).json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error processing override notification:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router; 