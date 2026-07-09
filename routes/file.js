const router = require('express').Router();
const { getFile, deleteFile } = require('../utils/mongoStorage');
const { auth } = require('../middleware/auth');

// ✅ View File (Opens in browser)
router.get('/file/:id', auth, async (req, res) => {
  try {
    const file = await getFile(req.params.id);
    if (!file) {
      return res.status(404).send(`
        <h2>❌ File Not Found</h2>
        <p>The file you are looking for does not exist.</p>
        <p><a href="javascript:history.back()">← Go Back</a></p>
      `);
    }
    
    res.set('Content-Type', file.contentType || 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${file.originalName}"`);
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(file.data);
  } catch (error) {
    console.error('❌ View File Error:', error);
    res.status(500).send(`
      <h2>❌ Server Error</h2>
      <p>Error: ${error.message}</p>
      <p><a href="javascript:history.back()">← Go Back</a></p>
    `);
  }
});

// ✅ Download File (Force Download)
router.get('/file/:id/download', auth, async (req, res) => {
  try {
    const file = await getFile(req.params.id);
    if (!file) {
      return res.status(404).send(`
        <h2>❌ File Not Found</h2>
        <p>The file you are trying to download does not exist.</p>
        <p><a href="javascript:history.back()">← Go Back</a></p>
      `);
    }
    
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(file.data);
  } catch (error) {
    console.error('❌ Download File Error:', error);
    res.status(500).send(`
      <h2>❌ Download Failed</h2>
      <p>Error: ${error.message}</p>
      <p><a href="javascript:history.back()">← Go Back</a></p>
    `);
  }
});

// ✅ Delete File
router.delete('/file/:id', auth, async (req, res) => {
  try {
    const file = await getFile(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    await deleteFile(req.params.id);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('❌ Delete File Error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;