# Testing Storage Dirty Indicator

## Test Steps:

1. **Load this notebook** 
   - Window title should show just the filename without the dirty indicator "•"

2. **Run the code cell below** 
   - This should mark the notebook as dirty
   - Window title should show "• filename.nbjs - NotebookJS" 
   - Toolbar should show "• filename" or "• Untitled"

3. **Save the notebook (Ctrl/Cmd+S)**
   - Window title should remove the dirty indicator
   - Toolbar should show just the filename without "•"

4. **Reload the notebook**
   - Storage data should persist
   - No dirty indicator should be shown

---

Run the code below to test storage persistence and dirty state:
