<div class="row justify-content-center">
    <div class="col-lg-8">
        <div class="card shadow" style="border-radius: 16px; border: 1px solid rgba(201, 168, 76, 0.08); overflow: hidden;">
            <!-- Card Header -->
            <div class="card-header" style="background: linear-gradient(135deg, #0a1628, #1a2a4a); border: none; padding: 20px 25px;">
                <h5 class="mb-0" style="color: #e8d5a3; font-weight: 700;">
                    <i class="bi bi-<%= typeof appointment !== 'undefined' && appointment ? 'pencil-square' : 'plus-circle' %>" style="color: #c9a84c;"></i>
                    <%= typeof appointment !== 'undefined' && appointment ? 'Edit Appointment' : 'New Appointment' %>
                </h5>
                <p style="color: rgba(232, 213, 163, 0.3); font-size: 0.7rem; margin: 5px 0 0; letter-spacing: 0.5px;">
                    <i class="bi bi-award-fill" style="color: #c9a84c; font-size: 0.5rem;"></i> 
                    <%= typeof appointment !== 'undefined' && appointment ? 'Update your appointment details' : 'Fill in the details to create a new appointment' %>
                </p>
            </div>
            
            <!-- Card Body -->
            <div class="card-body p-4" style="background: white;">
                <% if (typeof error !== 'undefined' && error) { %>
                    <div class="alert alert-danger alert-dismissible fade show" style="border-left: 4px solid #c62828; border-radius: 12px;">
                        <i class="bi bi-exclamation-triangle-fill" style="color: #c62828;"></i> 
                        <strong><%= error %></strong>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                <% } %>
                
                <!-- ===== DYNAMIC FORM ACTION ===== -->
                <% 
                    let formAction = '/client/appointment';
                    if (typeof appointment !== 'undefined' && appointment) {
                        if (typeof user !== 'undefined' && user.role === 'admin') {
                            formAction = '/admin/appointment/' + appointment._id + '/admin-update?_method=PUT';
                        } else {
                            formAction = '/client/appointment/' + appointment._id + '?_method=PUT';
                        }
                    }
                %>
                
                <!-- ===== FORM WITH enctype FOR FILE UPLOAD ===== -->
                <form action="<%= formAction %>" method="POST" enctype="multipart/form-data">
                    <div class="row g-3">
                        <!-- ===== APPOINTMENT ID (EDITABLE) ===== -->
                        <div class="col-md-6">
                            <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-hash" style="color: #c9a84c;"></i> Appointment ID <span style="color: #c62828;">*</span>
                            </label>
                            <div class="input-group" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(10, 22, 40, 0.05);">
                                <span class="input-group-text" style="background: #0a1628; color: #c9a84c; border: none; padding: 12px 18px;">
                                    <i class="bi bi-tag"></i>
                                </span>
                                <input type="text" name="appointmentId" class="form-control" 
                                       value="<%= typeof appointmentId !== 'undefined' ? appointmentId : '' %>" 
                                       placeholder="Enter Appointment ID (e.g., AP-260629-8695)" required
                                       style="border: 2px solid #e8d5a3; border-left: none; padding: 12px 18px; border-radius: 0 12px 12px 0; transition: all 0.3s ease; color: #0a1628; font-weight: 500;">
                            </div>
                        </div>
                        
                        <!-- ===== PO NUMBER ===== -->
                        <div class="col-md-6">
                            <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-file-text" style="color: #c9a84c;"></i> PO Number <span style="color: #c62828;">*</span>
                            </label>
                            <div class="input-group" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(10, 22, 40, 0.05);">
                                <span class="input-group-text" style="background: #0a1628; color: #c9a84c; border: none; padding: 12px 18px;">
                                    <i class="bi bi-file-text"></i>
                                </span>
                                <input type="text" name="poNumber" class="form-control" 
                                       value="<%= typeof appointment !== 'undefined' && appointment ? appointment.poNumber : '' %>" 
                                       placeholder="Enter PO Number" required
                                       style="border: 2px solid #e8d5a3; border-left: none; padding: 12px 18px; border-radius: 0 12px 12px 0; transition: all 0.3s ease;">
                            </div>
                        </div>
                        
                        <!-- ===== INVOICE NUMBER ===== -->
                        <div class="col-md-6">
                            <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-receipt" style="color: #c9a84c;"></i> Invoice Number <span style="color: #c62828;">*</span>
                            </label>
                            <div class="input-group" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(10, 22, 40, 0.05);">
                                <span class="input-group-text" style="background: #0a1628; color: #c9a84c; border: none; padding: 12px 18px;">
                                    <i class="bi bi-receipt"></i>
                                </span>
                                <input type="text" name="invoiceNumber" class="form-control" 
                                       value="<%= typeof appointment !== 'undefined' && appointment ? appointment.invoiceNumber : '' %>" 
                                       placeholder="Enter Invoice Number" required
                                       style="border: 2px solid #e8d5a3; border-left: none; padding: 12px 18px; border-radius: 0 12px 12px 0; transition: all 0.3s ease;">
                            </div>
                        </div>
                        
                        <!-- ===== E-WAY BILL ===== -->
                        <div class="col-md-6">
                            <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-truck" style="color: #c9a84c;"></i> E-Way Bill
                            </label>
                            <div class="input-group" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(10, 22, 40, 0.05);">
                                <span class="input-group-text" style="background: #0a1628; color: #c9a84c; border: none; padding: 12px 18px;">
                                    <i class="bi bi-truck"></i>
                                </span>
                                <input type="text" name="ewayBill" class="form-control" 
                                       value="<%= typeof appointment !== 'undefined' && appointment ? appointment.ewayBill : '' %>" 
                                       placeholder="Enter E-Way Bill Number"
                                       style="border: 2px solid #e8d5a3; border-left: none; padding: 12px 18px; border-radius: 0 12px 12px 0; transition: all 0.3s ease;">
                            </div>
                        </div>
                        
                        <!-- ===== DOCKET NUMBER ===== -->
                        <div class="col-md-6">
                            <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-box-seam" style="color: #c9a84c;"></i> Docket Number
                            </label>
                            <div class="input-group" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(10, 22, 40, 0.05);">
                                <span class="input-group-text" style="background: #0a1628; color: #c9a84c; border: none; padding: 12px 18px;">
                                    <i class="bi bi-box-seam"></i>
                                </span>
                                <input type="text" name="docketNumber" class="form-control" 
                                       value="<%= typeof appointment !== 'undefined' && appointment ? appointment.docketNumber : '' %>" 
                                       placeholder="Enter Docket Number"
                                       style="border: 2px solid #e8d5a3; border-left: none; padding: 12px 18px; border-radius: 0 12px 12px 0; transition: all 0.3s ease;">
                            </div>
                        </div>
                        
                        <!-- ===== ASN NUMBER ===== -->
                        <div class="col-md-6">
                            <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-upc-scan" style="color: #c9a84c;"></i> ASN Number
                            </label>
                            <div class="input-group" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(10, 22, 40, 0.05);">
                                <span class="input-group-text" style="background: #0a1628; color: #c9a84c; border: none; padding: 12px 18px;">
                                    <i class="bi bi-upc-scan"></i>
                                </span>
                                <input type="text" name="asnNumber" class="form-control" 
                                       value="<%= typeof appointment !== 'undefined' && appointment ? appointment.asnNumber : '' %>" 
                                       placeholder="Enter ASN Number"
                                       style="border: 2px solid #e8d5a3; border-left: none; padding: 12px 18px; border-radius: 0 12px 12px 0; transition: all 0.3s ease;">
                            </div>
                        </div>
                        
                        <!-- ===== CONTACT PERSON ===== -->
                        <div class="col-md-6">
                            <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-person" style="color: #c9a84c;"></i> Contact Person
                            </label>
                            <div class="input-group" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(10, 22, 40, 0.05);">
                                <span class="input-group-text" style="background: #0a1628; color: #c9a84c; border: none; padding: 12px 18px;">
                                    <i class="bi bi-person"></i>
                                </span>
                                <input type="text" name="contactPerson" class="form-control" 
                                       value="<%= typeof appointment !== 'undefined' && appointment ? appointment.contactPerson : '' %>" 
                                       placeholder="Enter Contact Person Name"
                                       style="border: 2px solid #e8d5a3; border-left: none; padding: 12px 18px; border-radius: 0 12px 12px 0; transition: all 0.3s ease;">
                            </div>
                        </div>
                        
                        <!-- ===== CONTACT NUMBER ===== -->
                        <div class="col-md-6">
                            <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-telephone" style="color: #c9a84c;"></i> Contact Number
                            </label>
                            <div class="input-group" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(10, 22, 40, 0.05);">
                                <span class="input-group-text" style="background: #0a1628; color: #c9a84c; border: none; padding: 12px 18px;">
                                    <i class="bi bi-telephone"></i>
                                </span>
                                <input type="tel" name="contactNumber" class="form-control" 
                                       value="<%= typeof appointment !== 'undefined' && appointment ? appointment.contactNumber : '' %>" 
                                       placeholder="Enter Contact Number (e.g., 9876543210)"
                                       style="border: 2px solid #e8d5a3; border-left: none; padding: 12px 18px; border-radius: 0 12px 12px 0; transition: all 0.3s ease;">
                            </div>
                        </div>
                        
                        <!-- ===== DELIVERY DATE ===== -->
                        <div class="col-md-6">
                            <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-calendar3" style="color: #c9a84c;"></i> Delivery Date <span style="color: #c62828;">*</span>
                            </label>
                            <div class="input-group" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(10, 22, 40, 0.05);">
                                <span class="input-group-text" style="background: #0a1628; color: #c9a84c; border: none; padding: 12px 18px;">
                                    <i class="bi bi-calendar3"></i>
                                </span>
                                <input type="date" name="deliveryDate" class="form-control" 
                                       value="<%= typeof appointment !== 'undefined' && appointment ? new Date(appointment.deliveryDate).toISOString().split('T')[0] : '' %>" 
                                       required
                                       style="border: 2px solid #e8d5a3; border-left: none; padding: 12px 18px; border-radius: 0 12px 12px 0; transition: all 0.3s ease;">
                            </div>
                        </div>
                        
                        <!-- ===== DELIVERY ADDRESS ===== -->
                        <div class="col-12">
                            <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-geo-alt" style="color: #c9a84c;"></i> Delivery Address <span style="color: #c62828;">*</span>
                            </label>
                            <div class="input-group" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(10, 22, 40, 0.05);">
                                <span class="input-group-text" style="background: #0a1628; color: #c9a84c; border: none; padding: 12px 18px; align-items: flex-start; padding-top: 15px;">
                                    <i class="bi bi-geo-alt"></i>
                                </span>
                                <textarea name="deliveryAddress" class="form-control" rows="3" required
                                          placeholder="Enter complete delivery address"
                                          style="border: 2px solid #e8d5a3; border-left: none; padding: 12px 18px; border-radius: 0 12px 12px 0; transition: all 0.3s ease; resize: vertical;"><%= typeof appointment !== 'undefined' && appointment ? appointment.deliveryAddress : '' %></textarea>
                            </div>
                        </div>
                        
                        <!-- ===== REMARKS ===== -->
                        <div class="col-12">
                            <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-chat" style="color: #c9a84c;"></i> Remarks
                            </label>
                            <div class="input-group" style="border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(10, 22, 40, 0.05);">
                                <span class="input-group-text" style="background: #0a1628; color: #c9a84c; border: none; padding: 12px 18px; align-items: flex-start; padding-top: 15px;">
                                    <i class="bi bi-chat"></i>
                                </span>
                                <textarea name="remarks" class="form-control" rows="2"
                                          placeholder="Any additional remarks or special instructions"
                                          style="border: 2px solid #e8d5a3; border-left: none; padding: 12px 18px; border-radius: 0 12px 12px 0; transition: all 0.3s ease; resize: vertical;"><%= typeof appointment !== 'undefined' && appointment ? appointment.remarks : '' %></textarea>
                            </div>
                        </div>
                        
                        <!-- ============================================================ -->
                        <!-- ===== PDF UPLOAD SECTION - BOTH CLIENT & ADMIN ===== -->
                        <!-- ============================================================ -->
                        <div class="col-12">
                            <hr style="border-color: rgba(201, 168, 76, 0.15);">
                            <h6 style="color: #0a1628; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-file-pdf" style="color: #c9a84c;"></i> Attach Documents (PDF Only)
                            </h6>
                        </div>

                        <!-- ===== PO PDF Upload (Both Client & Admin) ===== -->
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

                        <!-- ===== Invoice PDF Upload (Both Client & Admin) ===== -->
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

                        <!-- ===== E-Way Bill PDF Upload (Both Client & Admin) ===== -->
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

                        <!-- ============================================================ -->
                        <!-- ===== POD UPLOAD SECTION - ADMIN ONLY ===== -->
                        <!-- ============================================================ -->
                        <% if (typeof user !== 'undefined' && user.role === 'admin') { %>
                        <div class="col-12">
                            <hr style="border-color: rgba(201, 168, 76, 0.15);">
                            <h6 style="color: #0a1628; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-file-earmark-pdf" style="color: #c9a84c;"></i> POD Upload - <span style="color: #c62828;">Admin Only</span>
                            </h6>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" style="color: #0a1628; font-weight: 700; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="bi bi-file-check" style="color: #c9a84c;"></i> POD PDF
                            </label>
                            <input type="file" name="podFile" class="form-control" accept=".pdf" style="border: 2px solid #e8d5a3; border-radius: 12px; padding: 8px 12px; border-color: #c9a84c;">
                            <% if (typeof appointment !== 'undefined' && appointment && appointment.podFile) { %>
                                <small style="color: rgba(10, 22, 40, 0.4); font-size: 0.65rem;">
                                    <i class="bi bi-check-circle" style="color: #2e7d32;"></i> Current: <%= appointment.podFileOriginalName || 'Uploaded' %>
                                </small>
                            <% } %>
                        </div>

                        <div class="col-12">
                            <small style="color: rgba(10, 22, 40, 0.3); font-size: 0.6rem;">
                                <i class="bi bi-info-circle"></i> Only PDF files are allowed. Max size: 5MB.
                            </small>
                        </div>
                        <% } %>
                        <!-- ============================================================ -->
                        
                        <!-- ===== BUTTONS ===== -->
                        <div class="col-12 mt-3">
                            <button type="submit" class="btn" style="background: linear-gradient(135deg, #c9a84c, #a8873a); color: #0a1628; font-weight: 700; border: none; border-radius: 50px; padding: 12px 35px; box-shadow: 0 4px 20px rgba(201, 168, 76, 0.3); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.75rem;">
                                <i class="bi bi-<%= typeof appointment !== 'undefined' && appointment ? 'check-circle' : 'save' %>"></i>
                                <%= typeof appointment !== 'undefined' && appointment ? 'Update Appointment' : 'Create Appointment' %>
                            </button>
                            <a href="<%= typeof user !== 'undefined' && user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard' %>" class="btn" style="background: rgba(10, 22, 40, 0.05); color: #0a1628; font-weight: 600; border: 2px solid rgba(10, 22, 40, 0.1); border-radius: 50px; padding: 12px 35px; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.75rem; margin-left: 10px;">
                                <i class="bi bi-x-circle"></i> Cancel
                            </a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- ===== Extra Styles ===== -->
<style>
    /* Form Input Focus Effect */
    .card-body .form-control:focus {
        border-color: #c9a84c !important;
        box-shadow: 0 0 0 4px rgba(201, 168, 76, 0.1) !important;
        transform: translateY(-2px);
    }
    
    /* Textarea Focus Effect */
    .card-body textarea.form-control:focus {
        border-color: #c9a84c !important;
        box-shadow: 0 0 0 4px rgba(201, 168, 76, 0.1) !important;
        transform: translateY(-2px);
    }
    
    /* File Input Focus Effect */
    .card-body input[type="file"]:focus {
        border-color: #c9a84c !important;
        box-shadow: 0 0 0 4px rgba(201, 168, 76, 0.1) !important;
    }
    
    /* Submit Button Hover */
    .card-body .btn[type="submit"]:hover {
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 8px 40px rgba(201, 168, 76, 0.45) !important;
        background: linear-gradient(135deg, #e8d5a3, #c9a84c) !important;
    }
    
    /* Cancel Button Hover */
    .card-body .btn[href*="/dashboard"]:hover {
        background: rgba(10, 22, 40, 0.1) !important;
        border-color: rgba(10, 22, 40, 0.2) !important;
        transform: translateY(-2px);
    }
    
    /* Form Labels */
    .card-body .form-label {
        font-size: 0.75rem !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
    }
    
    /* Required Field Indicator */
    .card-body .form-label span {
        color: #c62828 !important;
    }
    
    /* Card Animation */
    .card {
        animation: fadeInUp 0.5s ease forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .card-body {
            padding: 20px !important;
        }
        
        .card-body .row.g-3 {
            gap: 15px !important;
        }
        
        .card-body .btn {
            width: 100% !important;
            margin-left: 0 !important;
            margin-top: 10px !important;
            text-align: center !important;
            justify-content: center !important;
        }
        
        .card-body .btn[href*="/dashboard"] {
            margin-left: 0 !important;
        }
        
        .card-header h5 {
            font-size: 1rem !important;
        }
    }
    
    @media (max-width: 576px) {
        .card-body {
            padding: 15px !important;
        }
        
        .card-body .input-group-text {
            padding: 10px 12px !important;
            font-size: 0.8rem !important;
        }
        
        .card-body .form-control {
            padding: 10px 12px !important;
            font-size: 0.85rem !important;
        }
        
        .card-body textarea.form-control {
            padding: 10px 12px !important;
            font-size: 0.85rem !important;
        }
        
        .card-body input[type="file"] {
            padding: 8px 10px !important;
            font-size: 0.75rem !important;
        }
        
        .card-body .btn {
            font-size: 0.65rem !important;
            padding: 10px 20px !important;
        }
    }
</style>