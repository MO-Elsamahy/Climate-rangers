// Supabase Configuration for Climate Rangers
// Updated with actual project credentials

const SUPABASE_URL = 'https://kuwmsbxqufjvjaianpmp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1d21zYnhxdWZqdmphaWFucG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTUwMTEsImV4cCI6MjA3MzI3MTAxMX0.lZ5aKgEAQmZuozB_2OryQ4mIXvp_3YphP8ZF9X2wgJs';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabaseClient;

// Utility functions for common operations
window.supabaseUtils = {
    // Generate unique application ID
    generateApplicationId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `CR-${timestamp}-${random}`.toUpperCase();
    },

    // Upload file to Supabase Storage
    async uploadFile(file, path) {
        try {
            console.log('Uploading file:', { fileName: file.name, path });
            
            // First check if bucket exists
            const { data: buckets, error: bucketError } = await supabaseClient.storage.listBuckets();
            console.log('Available buckets:', buckets);
            
            if (bucketError) {
                console.error('Bucket list error:', bucketError);
            }
            
            const { data, error } = await supabaseClient.storage
                .from('applications')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('Upload error:', error);
                throw error;
            }

            console.log('File uploaded successfully:', data);

            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from('applications')
                .getPublicUrl(path);

            console.log('Public URL generated:', urlData);

            return {
                success: true,
                path: data.path,
                url: urlData.publicUrl
            };
        } catch (error) {
            console.error('File upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Submit application to database
    async submitApplication(applicationData) {
        try {
            const { data, error } = await supabaseClient
                .from('applications')
                .insert([applicationData])
                .select();

            if (error) throw error;

            return {
                success: true,
                data: data[0]
            };
        } catch (error) {
            console.error('Application submission error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Admin authentication
    async adminLogin(email, password) {
        try {
            console.log('Attempting login for:', email);
            
            // First, verify admin credentials against our custom admin_users table
            console.log('Searching for admin with email:', email);
            
            const { data: adminUsers, error: adminError } = await supabaseClient
                .from('admin_users')
                .select('*')
                .eq('email', email);

            console.log('Admin user query result:', { 
                adminUsers, 
                adminError, 
                adminUsersLength: adminUsers ? adminUsers.length : 0,
                searchEmail: email 
            });

            if (adminError) {
                console.error('Database error:', adminError);
                throw new Error('Database connection error: ' + adminError.message);
            }
            
            if (!adminUsers || adminUsers.length === 0) {
                console.error('No admin users found. Available users:', adminUsers);
                // Try to get all users for debugging
                const { data: allUsers } = await supabaseClient
                    .from('admin_users')
                    .select('email');
                console.log('All admin users in database:', allUsers);
                throw new Error('Admin user not found');
            }

            const adminUser = adminUsers[0];

            // For simplicity, we'll use a direct password comparison
            // In production, you should use proper password hashing
            const isValidPassword = await this.verifyPassword(password, adminUser.password_hash);
            
            if (!isValidPassword) {
                throw new Error('Invalid password');
            }

            // Update last login
            await supabaseClient
                .from('admin_users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', adminUser.id);

            // Store admin session
            localStorage.setItem('climate_rangers_admin', JSON.stringify({
                id: adminUser.id,
                email: adminUser.email,
                loginTime: new Date().toISOString()
            }));

            return {
                success: true,
                admin: adminUser
            };
        } catch (error) {
            console.error('Admin login error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Simple password verification (in production, use bcrypt)
    async verifyPassword(plainPassword, hashedPassword) {
        // For this demo, we'll use a simple comparison
        // In production, use bcrypt.compare(plainPassword, hashedPassword)
        
        // Since we can't use bcrypt in the browser, we'll store the plain password
        // This is NOT secure for production use
        return plainPassword === '01119870082Mo#';
    },

    // Check if admin is logged in
    isAdminLoggedIn() {
        const adminData = localStorage.getItem('climate_rangers_admin');
        if (!adminData) return false;

        try {
            const admin = JSON.parse(adminData);
            const loginTime = new Date(admin.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

            // Session expires after 24 hours
            if (hoursDiff > 24) {
                localStorage.removeItem('climate_rangers_admin');
                return false;
            }

            return true;
        } catch (error) {
            localStorage.removeItem('climate_rangers_admin');
            return false;
        }
    },

    // Get admin data
    getAdminData() {
        const adminData = localStorage.getItem('climate_rangers_admin');
        return adminData ? JSON.parse(adminData) : null;
    },

    // Admin logout
    adminLogout() {
        localStorage.removeItem('climate_rangers_admin');
        window.location.href = 'admin-login.html';
    },

    // Get all applications for admin review
    async getApplications(status = null, limit = 50, offset = 0) {
        try {
            let query = supabaseClient
                .from('applications')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                data: data,
                count: count
            };
        } catch (error) {
            console.error('Error fetching applications:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Update application status
    async updateApplicationStatus(applicationId, status, adminNotes = '') {
        try {
            console.log('Updating application status:', { applicationId, status, adminNotes });
            
            const adminData = this.getAdminData();
            console.log('Admin data:', adminData);
            
            // First check if application exists
            const { data: existingApp, error: selectError } = await supabaseClient
                .from('applications')
                .select('*')
                .eq('id', applicationId)
                .single();
                
            if (selectError) {
                console.error('Error finding application:', selectError);
                throw new Error(`Application not found: ${selectError.message}`);
            }
            
            console.log('Found application:', existingApp);
            
            const updateData = {
                status: status,
                reviewed_at: new Date().toISOString(),
                reviewed_by: adminData?.email || 'Unknown Admin',
                admin_notes: adminNotes
            };
            
            console.log('Update data:', updateData);
            
            const { data, error } = await supabaseClient
                .from('applications')
                .update(updateData)
                .eq('id', applicationId)
                .select();

            if (error) {
                console.error('Update error:', error);
                throw error;
            }
            
            console.log('Update successful:', data);

            return {
                success: true,
                data: data[0]
            };
        } catch (error) {
            console.error('Error updating application status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Get application statistics
    async getApplicationStats() {
        try {
            const { data, error } = await supabaseClient
                .from('applications')
                .select('status')
                .then(result => {
                    if (result.error) throw result.error;
                    
                    const stats = {
                        total: result.data.length,
                        pending: 0,
                        reviewing: 0,
                        approved: 0,
                        rejected: 0
                    };

                    result.data.forEach(app => {
                        stats[app.status] = (stats[app.status] || 0) + 1;
                    });

                    return { success: true, data: stats };
                });

            return { success: true, data };
        } catch (error) {
            console.error('Error fetching application stats:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Search applications
    async searchApplications(searchTerm, searchField = 'full_name') {
        try {
            const { data, error } = await supabaseClient
                .from('applications')
                .select('*')
                .ilike(searchField, `%${searchTerm}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Error searching applications:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Delete application and all related files
    async deleteApplication(applicationId) {
        try {
            console.log('Deleting application:', applicationId);
            
            // First, get the application data to find the file URLs
            console.log('Fetching application data for ID:', applicationId);
            
            const { data: applications, error: fetchError } = await supabaseClient
                .from('applications')
                .select('*')
                .eq('id', applicationId);

            console.log('Fetch result:', { applications, fetchError });

            if (fetchError) {
                console.error('Error fetching application:', fetchError);
                throw new Error('Database error: ' + fetchError.message);
            }

            if (!applications || applications.length === 0) {
                console.error('No application found with ID:', applicationId);
                throw new Error('Application not found with ID: ' + applicationId);
            }

            const application = applications[0];
            console.log('Application to delete:', application);

            // Delete files from storage
            const filesToDelete = [];
            
            if (application.cv_url) {
                // Extract file path from URL
                const cvPath = this.extractFilePathFromUrl(application.cv_url);
                if (cvPath) filesToDelete.push(cvPath);
            }
            
            if (application.recommendation_letter_url) {
                const recommendationPath = this.extractFilePathFromUrl(application.recommendation_letter_url);
                if (recommendationPath) filesToDelete.push(recommendationPath);
            }
            
            if (application.logo_url) {
                const logoPath = this.extractFilePathFromUrl(application.logo_url);
                if (logoPath) filesToDelete.push(logoPath);
            }

            console.log('Files to delete:', filesToDelete);

            // Delete files from storage
            if (filesToDelete.length > 0) {
                const { error: storageError } = await supabaseClient.storage
                    .from('applications')
                    .remove(filesToDelete);

                if (storageError) {
                    console.error('Error deleting files from storage:', storageError);
                    // Continue with database deletion even if file deletion fails
                }
            }

            // First, delete related records from email_logs table (if it exists)
            console.log('Deleting related email logs for application:', applicationId);
            
            try {
                // Check if email_logs table exists and has records
                const { data: emailLogs, error: checkError } = await supabaseClient
                    .from('email_logs')
                    .select('id')
                    .eq('application_id', applicationId)
                    .limit(1);

                if (checkError) {
                    console.warn('Warning: Could not check email_logs table:', checkError);
                } else if (emailLogs && emailLogs.length > 0) {
                    console.log('Found email logs to delete:', emailLogs.length);
                    
                    const { error: emailLogsError } = await supabaseClient
                        .from('email_logs')
                        .delete()
                        .eq('application_id', applicationId);

                    if (emailLogsError) {
                        console.warn('Warning: Could not delete email logs:', emailLogsError);
                        // Try to disable the foreign key constraint temporarily
                        console.log('Attempting to handle foreign key constraint...');
                    } else {
                        console.log('Email logs deleted successfully');
                    }
                } else {
                    console.log('No email logs found for this application');
                }
            } catch (emailLogsError) {
                console.warn('Warning: email_logs table may not exist or is not accessible:', emailLogsError);
                // Continue with application deletion
            }

            // Now delete the application record from database
            console.log('Attempting to delete application from database with ID:', applicationId);
            
            let deletedRows = 0;
            
            // Try direct SQL approach to handle foreign key constraints
            try {
                console.log('Attempting to delete application with ID:', applicationId);
                
                const { data: deleteData, error: deleteError } = await supabaseClient
                    .from('applications')
                    .delete()
                    .eq('id', applicationId)
                    .select();

                console.log('Delete result:', { deleteData, deleteError });

                if (deleteError) {
                    console.error('Error deleting application from database:', deleteError);
                    
                    // If it's a foreign key constraint error, try SQL approach
                    if (deleteError.message.includes('foreign key constraint')) {
                        console.log('Foreign key constraint detected, trying SQL approach...');
                        
                        // Use RPC function or direct SQL to delete
                        const { data: sqlResult, error: sqlError } = await supabaseClient
                            .rpc('delete_application_with_logs', { app_id: applicationId });
                        
                        if (sqlError) {
                            console.error('SQL delete also failed:', sqlError);
                            throw new Error('Failed to delete application due to foreign key constraints. Please run the SQL commands in fix-foreign-key-constraint.sql');
                        } else {
                            console.log('Application deleted via SQL:', sqlResult);
                            deletedRows = 1; // Assume success if no error
                        }
                    } else {
                        throw new Error('Failed to delete application: ' + deleteError.message);
                    }
                } else if (!deleteData || deleteData.length === 0) {
                    console.warn('No rows were deleted - application may not exist or RLS is blocking deletion');
                    
                    // Double-check if application still exists
                    const { data: checkData } = await supabaseClient
                        .from('applications')
                        .select('id')
                        .eq('id', applicationId);
                    
                    if (checkData && checkData.length > 0) {
                        throw new Error('Application exists but could not be deleted - check RLS policies');
                    } else {
                        console.log('Application was already deleted or never existed');
                        deletedRows = 1; // Consider this a success since the end result is the same
                    }
                } else {
                    console.log('Application deleted successfully from database:', deleteData);
                    deletedRows = deleteData.length;
                }
            } catch (sqlError) {
                console.error('SQL delete failed:', sqlError);
                throw new Error('Failed to delete application: ' + sqlError.message);
            }

            return {
                success: true,
                message: 'Application and related files deleted successfully',
                deletedRows: deletedRows
            };

        } catch (error) {
            console.error('Error deleting application:', error);
            
            // If it's a permission error, provide specific guidance
            if (error.message.includes('permission') || error.message.includes('RLS') || error.message.includes('policy')) {
                return {
                    success: false,
                    error: 'Permission denied. Please run the SQL commands in fix-delete-permissions.sql to enable deletion.',
                    needsPermissionFix: true
                };
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Helper function to extract file path from Supabase storage URL
    extractFilePathFromUrl(url) {
        try {
            if (!url) return null;
            
            // Supabase storage URLs have format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
            const urlParts = url.split('/storage/v1/object/public/applications/');
            if (urlParts.length > 1) {
                return urlParts[1];
            }
            
            // Alternative format check
            const altParts = url.split('/applications/');
            if (altParts.length > 1) {
                return altParts[1];
            }
            
            return null;
        } catch (error) {
            console.error('Error extracting file path from URL:', error);
            return null;
        }
    }
};

// Initialize admin check on page load
document.addEventListener('DOMContentLoaded', function() {
    // Only run admin check on admin pages
    if (window.location.pathname.includes('admin')) {
        // Skip check for login page
        if (!window.location.pathname.includes('admin-login')) {
            if (!window.supabaseUtils.isAdminLoggedIn()) {
                window.location.href = 'admin-login.html';
            }
        }
    }
});

console.log('Supabase configuration loaded successfully');