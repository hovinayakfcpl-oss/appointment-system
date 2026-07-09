// ============================================
// AUTO-HIDE ALERTS AFTER 5 SECONDS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);
});

// ============================================
// CONFIRM DELETE
// ============================================
function confirmDelete() {
    return confirm('Are you sure you want to delete this appointment?');
}

// ============================================
// ✅ STATUS FILTER FUNCTION
// ============================================
function filterTable() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const rows = document.querySelectorAll('#appointmentsTable tbody tr, #adminRecentTable tbody tr, #clientAppTable tbody tr');
    const searchCount = document.getElementById('searchCount') || document.getElementById('adminSearchCount') || document.getElementById('clientAppSearchCount');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const statusValue = statusFilter ? statusFilter.value : 'all';
    
    let visibleCount = 0;

    rows.forEach(row => {
        const poNumber = row.getAttribute('data-po') || '';
        const docketNumber = row.getAttribute('data-docket') || '';
        const city = row.getAttribute('data-city') || '';
        const clientName = row.getAttribute('data-client') || '';
        const invoiceNumber = row.getAttribute('data-invoice') || '';
        const appointmentId = row.getAttribute('data-id') || '';
        const status = row.getAttribute('data-status') || '';
        
        const matchesSearch = poNumber.includes(searchTerm) || 
                              docketNumber.includes(searchTerm) || 
                              city.includes(searchTerm) || 
                              clientName.includes(searchTerm) ||
                              invoiceNumber.includes(searchTerm) ||
                              appointmentId.includes(searchTerm);
        
        const matchesStatus = statusValue === 'all' || status === statusValue;
        
        if (matchesSearch && matchesStatus) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    if (searchCount) {
        searchCount.textContent = visibleCount;
    }
}

// ============================================
// ✅ PINCODE AUTO-FETCH CITY
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const pincodeInput = document.getElementById('pincodeInput');
    const cityInput = document.getElementById('cityInput');
    
    if (pincodeInput && cityInput) {
        let timeoutId = null;
        
        pincodeInput.addEventListener('input', function() {
            const pincode = this.value.trim();
            
            // Only proceed if 6 digits
            if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
                cityInput.value = '';
                return;
            }
            
            // Clear previous timeout
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            // Show loading state
            cityInput.value = 'Fetching city...';
            cityInput.style.color = '#999';
            
            // Fetch city from API
            timeoutId = setTimeout(async function() {
                try {
                    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                    const data = await response.json();
                    
                    if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
                        const postOffice = data[0].PostOffice[0];
                        const city = postOffice.District || postOffice.Division || postOffice.Region || postOffice.State || 'Unknown';
                        cityInput.value = city;
                        cityInput.style.color = '#0a1628';
                    } else {
                        cityInput.value = 'City not found';
                        cityInput.style.color = '#c62828';
                    }
                } catch (error) {
                    console.error('Error fetching city:', error);
                    cityInput.value = 'Error fetching city';
                    cityInput.style.color = '#c62828';
                }
            }, 500);
        });
    }
});

// ============================================
// ✅ FILE DELETE FUNCTION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.delete-file').forEach(button => {
        button.addEventListener('click', async function() {
            const url = this.dataset.url;
            
            if (!url) {
                alert('❌ Error: Delete URL not found');
                return;
            }
            
            const fileName = this.closest('div')?.querySelector('small')?.textContent?.trim() || 'file';
            
            if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
                return;
            }
            
            try {
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ File deleted successfully!');
                    location.reload();
                } else {
                    alert('❌ Error: ' + (result.error || 'Something went wrong'));
                }
            } catch (error) {
                alert('❌ Error deleting file');
                console.error(error);
            }
        });
    });
});

// ============================================
// ✅ PRINT FUNCTION
// ============================================
function printAppointment() {
    window.print();
}

// ============================================
// ✅ FORMAT DATE
// ============================================
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });
}

// ============================================
// ✅ FORMAT DATE TIME
// ============================================
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// ✅ TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const colors = {
        success: '#2e7d32',
        error: '#c62828',
        warning: '#e65100',
        info: '#00695c'
    };
    
    const icons = {
        success: 'check-circle-fill',
        error: 'exclamation-triangle-fill',
        warning: 'exclamation-triangle-fill',
        info: 'info-circle-fill'
    };
    
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white border-0 show';
    toast.style.backgroundColor = colors[type] || colors.info;
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="bi bi-${icons[type] || icons.info} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// ✅ COPY TO CLIPBOARD
// ============================================
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Copied to clipboard!', 'success');
    });
}