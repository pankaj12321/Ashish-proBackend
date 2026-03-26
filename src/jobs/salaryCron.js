const cron = require('node-cron');
const Staff = require('../models/staff');
const StaffKhatabook = require('../models/staffKhataBook');
const logger = require('../utils/logger');

const startSalaryCron = () => {
    // Run at 00:00 on the 1st of every month
    cron.schedule('0 0 1 * *', async () => {
        logger.info('Running monthly salary automation cron job...');
        try {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonthName = today.toLocaleString('default', { month: 'long' });

            // Calculate previous month and year
            const prevDate = new Date();
            prevDate.setMonth(today.getMonth() - 1);
            const prevYear = prevDate.getFullYear();
            const prevMonthName = prevDate.toLocaleString('default', { month: 'long' });

            const staffs = await Staff.find({});

            for (const staff of staffs) {
                // 1. Process previous month's salary for Khatabook
                const prevSalaryRecord = staff.staffPayableSalary.find(
                    record => record.month === prevMonthName && record.year === prevYear
                );

                if (prevSalaryRecord && prevSalaryRecord.totalPayableSalary > 0) {
                    let khatabook = await StaffKhatabook.findOne({ staffId: staff.staffId });
                    
                    if (!khatabook) {
                        khatabook = new StaffKhatabook({
                            staffId: staff.staffId,
                            paidToStaff: [],
                            takenFromStaff: [],
                            totalPaidToStaff: 0,
                            totalTakenFromStaffUser: 0
                        });
                    }

                    const salaryEntry = {
                        Rs: prevSalaryRecord.totalPayableSalary,
                        paymentMode: 'cash', // Default mode for automated entries
                        description: `Monthly Salary for ${prevMonthName} ${prevYear} (Auto-generated)`,
                        updatedAt: new Date()
                    };

                    khatabook.paidToStaff.push(salaryEntry);
                    
                    await khatabook.save();
                    logger.info(`Automated salary entry added for staff ${staff.staffId} for ${prevMonthName} ${prevYear}`);
                }

                // 2. Initialize current month's record in staffPayableSalary
                const currentSalaryRecord = staff.staffPayableSalary.find(
                    record => record.month === currentMonthName && record.year === currentYear
                );

                if (!currentSalaryRecord) {
                    staff.staffPayableSalary.push({
                        month: currentMonthName,
                        year: currentYear,
                        totalPayableSalary: 0,
                        presentDays: 0,
                        paidLeaveDays: 0
                    });
                    await staff.save();
                    logger.info(`Initialized salary record for staff ${staff.staffId} for ${currentMonthName} ${currentYear}`);
                }
            }
            logger.info('Monthly salary automation cron job completed successfully.');
        } catch (error) {
            logger.error('Error in monthly salary automation cron job:', error);
        }
    });
};

module.exports = { startSalaryCron };
