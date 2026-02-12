import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';


export const exportUsersToPDF = (users) => {
  try {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Users Report', 14, 22);
    
    const tableColumn = ['Name', 'Email', 'Phone', 'Status', 'Created Date'];
    const tableRows = users.map(user => [
      user.userDetail?.name || 'N/A',
      user.email || 'N/A',
      user.phoneNumber || 'N/A',
      user.status || 'N/A',
      new Date(user.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save('users-report.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  }
};


export const exportUsersToExcel = (users) => {
  const worksheet = XLSX.utils.json_to_sheet(
    users.map(user => ({
      'Name': user.name || 'N/A',
      'Email': user.email || 'N/A',
      'Phone': user.phoneNumber || 'N/A',
      'Status': user.status || 'N/A',
      'Created Date': new Date(user.createdAt).toLocaleDateString()
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
  XLSX.writeFile(workbook, 'users-report.xlsx');
};


export const exportUsersToCSV = (users) => {
  const worksheet = XLSX.utils.json_to_sheet(
    users.map(user => ({
      'Name': user.userDetail?.name || 'N/A',
      'Email': user.email || 'N/A',
      'Phone': user.phoneNumber || 'N/A',
      'Status': user.status || 'N/A',
      'Created Date': new Date(user.createdAt).toLocaleDateString()
    }))
  );

  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'users-report.csv';
  link.click();
};


export const exportTutorsToPDF = (tutors) => {
  try {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Tutors Report', 14, 22);
    
    const tableColumn = ['Tutor ID', 'Name', 'Email', 'Phone', 'Rating', 'Status', 'Created Date'];
    const tableRows = tutors.map(tutor => [
      tutor.tutorDetail?.tutorId || 'N/A',
      tutor.tutorDetail?.name || 'N/A',
      tutor.email || 'N/A',
      tutor.phoneNumber || 'N/A',
      tutor.tutorDetail?.averageRating || '0.00',
      tutor.status || 'N/A',
      new Date(tutor.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save('tutors-report.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  }
};


export const exportTutorsToExcel = (tutors) => {
  const worksheet = XLSX.utils.json_to_sheet(
    tutors.map(tutor => ({
      'Tutor ID': tutor.tutorDetail?.tutorId || 'N/A',
      'Name': tutor.tutorDetail?.name || 'N/A',
      'Email': tutor.email || 'N/A',
      'Phone': tutor.phoneNumber || 'N/A',
      'Gender': tutor.tutorDetail?.gender || 'N/A',
      'Rating': tutor.tutorDetail?.averageRating || '0.00',
      'Hourly Rate': tutor.tutorDetail?.hourlyRate || '0.00',
      'Status': tutor.status || 'N/A',
      'Created Date': new Date(tutor.createdAt).toLocaleDateString()
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tutors');
  XLSX.writeFile(workbook, 'tutors-report.xlsx');
};


export const exportTutorsToCSV = (tutors) => {
  const worksheet = XLSX.utils.json_to_sheet(
    tutors.map(tutor => ({
      'Tutor ID': tutor.tutorDetail?.tutorId || 'N/A',
      'Name': tutor.tutorDetail?.name || 'N/A',
      'Email': tutor.email || 'N/A',
      'Phone': tutor.phoneNumber || 'N/A',
      'Gender': tutor.tutorDetail?.gender || 'N/A',
      'Rating': tutor.tutorDetail?.averageRating || '0.00',
      'Hourly Rate': tutor.tutorDetail?.hourlyRate || '0.00',
      'Status': tutor.status || 'N/A',
      'Created Date': new Date(tutor.createdAt).toLocaleDateString()
    }))
  );

  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'tutors-report.csv';
  link.click();
};