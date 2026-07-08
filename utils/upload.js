<!-- ===== PDF UPLOAD SECTION - SIRF ADMIN KE LIYE ===== -->
<% if (typeof user !== 'undefined' && user.role === 'admin') { %>
<div class="col-12">
    <hr style="border-color: rgba(201, 168, 76, 0.15);">
    <h6 style="color: #0a1628; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">
        <i class="bi bi-file-pdf" style="color: #c9a84c;"></i> Attach Documents (PDF Only) - <span style="color: #c62828;">Admin Only</span>
    </h6>
</div>

<!-- PO PDF Upload -->
<div class="col-md-4">
    <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">
        <i class="bi bi-file-text" style="color: #c9a84c;"></i> PO PDF
    </label>
    <input type="file" name="poFile" class="form-control" accept=".pdf" style="border: 2px solid #e8d5a3; border-radius: 12px; padding: 8px 12px;">
    <% if (typeof appointment !== 'undefined' && appointment && appointment.poFile) { %>
        <small style="color: rgba(10, 22, 40, 0.4); font-size: 0.65rem;">
            <i class="bi bi-check-circle" style="color: #2e7d32;"></i> Current: <%= appointment.poFileOriginalName || 'Uploaded' %>
        </small>
    <% } %>
</div>

<!-- Invoice PDF Upload -->
<div class="col-md-4">
    <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">
        <i class="bi bi-receipt" style="color: #c9a84c;"></i> Invoice PDF
    </label>
    <input type="file" name="invoiceFile" class="form-control" accept=".pdf" style="border: 2px solid #e8d5a3; border-radius: 12px; padding: 8px 12px;">
    <% if (typeof appointment !== 'undefined' && appointment && appointment.invoiceFile) { %>
        <small style="color: rgba(10, 22, 40, 0.4); font-size: 0.65rem;">
            <i class="bi bi-check-circle" style="color: #2e7d32;"></i> Current: <%= appointment.invoiceFileOriginalName || 'Uploaded' %>
        </small>
    <% } %>
</div>

<!-- E-Way Bill PDF Upload -->
<div class="col-md-4">
    <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">
        <i class="bi bi-truck" style="color: #c9a84c;"></i> E-Way Bill PDF
    </label>
    <input type="file" name="ewayBillFile" class="form-control" accept=".pdf" style="border: 2px solid #e8d5a3; border-radius: 12px; padding: 8px 12px;">
    <% if (typeof appointment !== 'undefined' && appointment && appointment.ewayBillFile) { %>
        <small style="color: rgba(10, 22, 40, 0.4); font-size: 0.65rem;">
            <i class="bi bi-check-circle" style="color: #2e7d32;"></i> Current: <%= appointment.ewayBillFileOriginalName || 'Uploaded' %>
        </small>
    <% } %>
</div>

<div class="col-12">
    <small style="color: rgba(10, 22, 40, 0.3); font-size: 0.6rem;">
        <i class="bi bi-info-circle"></i> Only PDF files are allowed. Max size: 5MB per file.
    </small>
</div>
<% } else { %>
    <!-- Client ke liye sirf uploaded files dikhao (agar hain toh) -->
    <% if (typeof appointment !== 'undefined' && appointment && (appointment.poFile || appointment.invoiceFile || appointment.ewayBillFile)) { %>
    <div class="col-12">
        <hr style="border-color: rgba(201, 168, 76, 0.15);">
        <h6 style="color: #0a1628; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">
            <i class="bi bi-file-pdf" style="color: #c9a84c;"></i> Attached Documents
        </h6>
        <div class="row g-2">
            <% if (appointment.poFile) { %>
            <div class="col-md-4">
                <div class="d-flex align-items-center gap-2 p-2" style="background: #f8f4eb; border-radius: 8px; border-left: 3px solid #c9a84c;">
                    <i class="bi bi-file-text" style="color: #c9a84c;"></i>
                    <span style="font-weight: 600; font-size: 0.75rem;">PO PDF</span>
                    <span class="badge" style="background: #2e7d32; color: white; font-size: 0.5rem;">Uploaded</span>
                </div>
            </div>
            <% } %>
            <% if (appointment.invoiceFile) { %>
            <div class="col-md-4">
                <div class="d-flex align-items-center gap-2 p-2" style="background: #f8f4eb; border-radius: 8px; border-left: 3px solid #c9a84c;">
                    <i class="bi bi-receipt" style="color: #c9a84c;"></i>
                    <span style="font-weight: 600; font-size: 0.75rem;">Invoice PDF</span>
                    <span class="badge" style="background: #2e7d32; color: white; font-size: 0.5rem;">Uploaded</span>
                </div>
            </div>
            <% } %>
            <% if (appointment.ewayBillFile) { %>
            <div class="col-md-4">
                <div class="d-flex align-items-center gap-2 p-2" style="background: #f8f4eb; border-radius: 8px; border-left: 3px solid #c9a84c;">
                    <i class="bi bi-truck" style="color: #c9a84c;"></i>
                    <span style="font-weight: 600; font-size: 0.75rem;">E-Way Bill PDF</span>
                    <span class="badge" style="background: #2e7d32; color: white; font-size: 0.5rem;">Uploaded</span>
                </div>
            </div>
            <% } %>
        </div>
    </div>
    <% } %>
<% } %>