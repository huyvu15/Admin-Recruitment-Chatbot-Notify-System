import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Files, HardDrive, FileText, Calendar } from 'lucide-react';
// import { Clock, Upload, Download, Trash2, Check, AlertTriangle } from 'lucide-react';
import 'tailwindcss/tailwind.css'; // Ensure you have TailwindCSS installed

function DashBoard() {
  const [fileDetails, setFileDetails] = useState({
    numberOfFiles: 0,
    totalSize: 0,
    files: []
  });

  const [daysSinceFirstUpload, setDaysSinceFirstUpload] = useState(0);
  const [dailyFileCount, setDailyFileCount] = useState([]);
  const [fileTypeCount, setFileTypeCount] = useState({
    pdf: 0,
    word: 0,
    excel: 0
  });

  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
    }
  });

  const BUCKET_NAME = 'huy-person-data';
  const CARD_STYLES = "bg-white rounded-lg shadow-lg p-6 transition-all hover:shadow-xl";

  const fetchS3Files = async () => {
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: 'cv/'
      });

      const response = await s3Client.send(command);

      return (response.Contents || []).map(obj => ({
        Key: obj.Key,
        LastModified: obj.LastModified,
        Size: obj.Size
      }));
    } catch (error) {
      console.error('Error fetching S3 files:', error);
      return [];
    }
  };

  const generateMockFiles = () => {
    const fileTypes = ['.pdf', '.docx', '.xlsx'];
    const mockFiles = [];
    const totalFiles = 50;

    for (let i = 0; i < totalFiles; i++) {
      const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
      const fileName = `document_${i + 1}${fileType}`;
      const lastModified = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));

      mockFiles.push({
        Key: `cv/${fileName}`,
        LastModified: lastModified,
        Size: Math.floor(Math.random() * 1024 * 1024)
      });
    }

    return mockFiles;
  };

  const getStartOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const getStartOfWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };

  const getStartOfMonth = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  };

  useEffect(() => {
    const fetchFiles = async () => {
      let files = [];
      try {
        files = await fetchS3Files();
        if (files.length === 0) {
          files = generateMockFiles();
        }
      } catch (error) {
        console.warn('Failed to fetch S3 files, using mock data', error);
        files = generateMockFiles();
      }

      const filteredFiles = files.filter(file => {
        const fileDate = new Date(file.LastModified);

        switch (dateFilter) {
          case 'today':
            return fileDate >= getStartOfToday();
          case 'thisWeek':
            return fileDate >= getStartOfWeek();
          case 'thisMonth':
            return fileDate >= getStartOfMonth();
          case 'custom':
            const startDate = customDateRange.startDate ? new Date(customDateRange.startDate) : null;
            const endDate = customDateRange.endDate ? new Date(customDateRange.endDate) : null;
            if (endDate) {
              endDate.setHours(23, 59, 59, 999);
            }
            return (!startDate || fileDate >= startDate) && (!endDate || fileDate <= endDate);
          default:
            return true;
        }
      });

      const totalSize = filteredFiles.reduce((sum, file) => sum + (file.Size || 0), 0);

      setFileDetails({
        numberOfFiles: filteredFiles.length,
        totalSize: (totalSize / (1024 * 1024)).toFixed(2),
        files: filteredFiles
      });

      if (filteredFiles.length > 0) {
        const firstFileDate = new Date(Math.min(...filteredFiles.map(file => new Date(file.LastModified))));
        const today = new Date();
        const diffTime = Math.abs(today - firstFileDate);
        setDaysSinceFirstUpload(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      const dailyCounts = getDailyFileCounts(filteredFiles);
      setDailyFileCount(dailyCounts);

      const typeCounts = getFileTypeCounts(filteredFiles);
      setFileTypeCount(typeCounts);
    };

    fetchFiles();
  }, [dateFilter, customDateRange]);

  const getDailyFileCounts = (files) => {
    const counts = {};

    files.forEach(file => {
      const date = new Date(file.LastModified).toLocaleDateString();

      if (counts[date]) {
        counts[date].pdf += file.Key.endsWith('.pdf') ? 1 : 0;
        counts[date].word += (file.Key.endsWith('.docx') || file.Key.endsWith('.doc')) ? 1 : 0;
        counts[date].excel += (file.Key.endsWith('.xlsx') || file.Key.endsWith('.xls')) ? 1 : 0;
        counts[date].total++;
      } else {
        counts[date] = {
          pdf: file.Key.endsWith('.pdf') ? 1 : 0,
          word: (file.Key.endsWith('.docx') || file.Key.endsWith('.doc')) ? 1 : 0,
          excel: (file.Key.endsWith('.xlsx') || file.Key.endsWith('.xls')) ? 1 : 0,
          total: 1
        };
      }
    });

    return Object.entries(counts).map(([date, count]) => ({
      name: date,
      pdf: count.pdf,
      word: count.word,
      excel: count.excel,
      total: count.total
    }));
  };

  const getFileTypeCounts = (files) => {
    const counts = { pdf: 0, word: 0, excel: 0 };

    files.forEach(file => {
      const extension = file.Key.split('.').pop().toLowerCase();
      if (extension === 'pdf') counts.pdf++;
      else if (extension === 'docx' || extension === 'doc') counts.word++;
      else if (extension === 'xlsx' || extension === 'xls') counts.excel++;
    });

    return counts;
  };

  const getFilePath = (fileKey) => {
    const region = 'us-east-1';
    const bucketName = 'huy-person-data';
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
    return url;
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffbb28', '#ffc658'];

  return (
    <div className="s3-dashboard p-6 bg-gradient-to-r from-blue-50 to-indigo-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-center text-indigo-800">S3 Bucket Analytics Dashboard</h1>

      <div className="mb-4 flex flex-wrap items-center justify-center space-x-4">
        <label className="font-semibold text-indigo-600">Filter by:</label>
        <select
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            if (e.target.value !== 'custom') {
              setCustomDateRange({ startDate: '', endDate: '' });
            }
          }}
          className="p-2 border rounded bg-white shadow-sm"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="thisWeek">This Week</option>
          <option value="thisMonth">This Month</option>
          <option value="custom">Custom Range</option>
        </select>

        {dateFilter === 'custom' && (
          <div className="flex space-x-2">
            <div>
              <label className="block text-sm">Start Date</label>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange(prev => ({
                  ...prev,
                  startDate: e.target.value
                }))}
                className="p-2 border rounded bg-white shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm">End Date</label>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange(prev => ({
                  ...prev,
                  endDate: e.target.value
                }))}
                className="p-2 border rounded bg-white shadow-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-lg font-semibold text-gray-600">Number of Files</h2>
          <p className="text-4xl font-bold text-indigo-700">{fileDetails.numberOfFiles}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-lg font-medium text-gray-600">Total Folder Size</h2>
          <p className="text-4xl font-bold text-green-700">{fileDetails.totalSize} MB</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-lg font-medium text-gray-600">PDF Files</h2>
          <p className="text-4xl font-bold text-purple-700">{fileTypeCount.pdf}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-lg font-medium text-gray-600">Days Since First Upload</h2>
          <p className="text-4xl font-bold text-orange-600">{daysSinceFirstUpload} days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-600">Files Uploaded per Day</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyFileCount}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#555" />
              <YAxis stroke="#555" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pdf" stroke="#8884d8" name="PDF" />
              <Line type="monotone" dataKey="word" stroke="#82ca9d" name="Word" />
              <Line type="monotone" dataKey="excel" stroke="#ffbb28" name="Excel" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-600">File Types Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'PDF', value: fileTypeCount.pdf },
                  { name: 'Word', value: fileTypeCount.word },
                  { name: 'Excel', value: fileTypeCount.excel }
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%" outerRadius={100} innerRadius={60} fill="#8884d8"
                label={({ name, value }) => `${name}: ${value}`}
                isAnimationActive={true}
              >
                {[
                  { name: 'PDF', value: fileTypeCount.pdf },
                  { name: 'Word', value: fileTypeCount.word },
                  { name: 'Excel', value: fileTypeCount.excel }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-gray-600">File Size Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyFileCount}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#555" />
              <YAxis stroke="#555" />
              <Tooltip />
              <Legend />
              <Bar dataKey="pdf" fill="#8884d8" name="PDF" />
              <Bar dataKey="word" fill="#82ca9d" name="Word" />
              <Bar dataKey="excel" fill="#ffbb28" name="Excel" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <table className="w-full text-left table-auto border-collapse">
          <thead className="bg-indigo-100">
            <tr>
              <th className="p-4">File Name</th>
              <th className="p-4">File Path</th>
              <th className="p-4">Size (KB)</th>
              <th className="p-4">Last Modified</th>
            </tr>
          </thead>
          <tbody>
            {fileDetails.files.map((file, index) => (
              <tr key={index} className={`border-t hover:bg-gray-100 ${index % 2 ? 'bg-gray-50' : ''}`}>
                <td className="p-4">{file.Key.split('/').pop()}</td>
                <td className="p-4">
                  <a href={getFilePath(file.Key)} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                    View
                  </a>
                </td>
                <td className="p-4">{(file.Size / 1024).toFixed(2)}</td>
                <td className="p-4">{new Date(file.LastModified).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DashBoard;