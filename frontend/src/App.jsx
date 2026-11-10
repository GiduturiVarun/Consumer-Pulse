
import { useMemo, useState } from "react";

import {
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  Package,
  Upload,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  CalendarDays,
  TrendingUp,
  Users,
  IndianRupee,
  Menu,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  X,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { uploadCSV } from "./api";
import "./App.css";

// Sample chart data used before a CSV is uploaded.
const salesData = [
  { day: "Mon", revenue: 3200 },
  { day: "Tue", revenue: 4100 },
  { day: "Wed", revenue: 3600 },
  { day: "Thu", revenue: 5200 },
  { day: "Fri", revenue: 4700 },
  { day: "Sat", revenue: 6500 },
  { day: "Sun", revenue: 5900 },
];

// Sample products used before a CSV is uploaded.
const sampleProducts = [
  {
    id: "P102",
    name: "Wireless Headphones",
    category: "Electronics",
    quantity: 3,
    revenue: 750,
  },
  {
    id: "P101",
    name: "Sample Product",
    category: "General",
    quantity: 5,
    revenue: 500,
  },
  {
    id: "P103",
    name: "Smart Water Bottle",
    category: "Lifestyle",
    quantity: 5,
    revenue: 250,
  },
];

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Sales Analytics", icon: BarChart3 },
  { label: "Products", icon: Package },
  { label: "Transactions", icon: ShoppingBag },
  { label: "Data Upload", icon: Upload },
];

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const [fileInputKey, setFileInputKey] = useState(0);

  // Format values as Indian currency.
  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  // Handle CSV selection.
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setUploadError("");
    setUploadResult(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setSelectedFile(null);
      setUploadError("Please select a CSV file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      setUploadError("File size must be less than 10 MB.");
      return;
    }

    setSelectedFile(file);
  };

  // Upload CSV to the backend.
  const handleUpload = async () => {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setUploadError("");
    setUploadResult(null);

    try {
      const result = await uploadCSV(selectedFile);
      setUploadResult(result);
    } catch (error) {
      setUploadError(
        error.message || "Something went wrong during upload."
      );
    } finally {
      setUploading(false);
    }
  };

  // Clear the upload form.
  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadError("");
    setFileInputKey((key) => key + 1);
  };

  const uploaded = Boolean(uploadResult?.success);

  // Read product summaries from the C++ analytics output.
  const parsedProducts = useMemo(() => {
    const output = uploadResult?.cppAnalytics?.output || "";

    const productLines = [
      ...output.matchAll(
        /^(\S+)\s+\|\s+Quantity:\s+(\d+)\s+\|\s+Revenue:\s+Rs\.\s*([\d,]+(?:\.\d{1,2})?)/gm
      ),
    ];

    return productLines.map((match) => ({
      id: match[1],
      name: match[1],
      category: "Uploaded product",
      quantity: Number(match[2]),
      revenue: Number(match[3].replace(/,/g, "")),
    }));
  }, [uploadResult]);

  // Calculate dashboard KPIs.
  const totalTransactions = uploaded
    ? Number(uploadResult.totalRecords || 0)
    : 5;

  const validTransactions = uploaded
    ? Number(uploadResult.validRecords || 0)
    : 5;

  const totalUnits = uploaded
    ? parsedProducts.reduce((sum, product) => sum + product.quantity, 0)
    : 13;

  const totalRevenue = uploaded
    ? parsedProducts.reduce((sum, product) => sum + product.revenue, 0)
    : 1500;

  const activeProducts = uploaded
    ? parsedProducts.length
    : 3;

  // Use actual daily revenue returned by PostgreSQL.
  const chartData = useMemo(() => {
    if (!uploaded) {
      return salesData;
    }

    const dailyRevenue = uploadResult?.dailyRevenue || [];

    return dailyRevenue.map((item) => ({
      day: new Date(
        `${item.date}T00:00:00`
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      revenue: Number(item.revenue || 0),
      transactions: Number(item.transactions || 0),
      units: Number(item.units || 0),
    }));
  }, [uploaded, uploadResult]);

  // Sort uploaded products by revenue.
  const displayedProducts = useMemo(() => {
    if (!uploaded) {
      return sampleProducts;
    }

    return [...parsedProducts].sort(
      (a, b) => b.revenue - a.revenue
    );
  }, [uploaded, parsedProducts]);

  const topProduct = displayedProducts[0];

  // Dashboard KPI cards.
  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      change: uploaded ? "Updated" : "12.8%",
      positive: true,
      icon: IndianRupee,
      note: uploaded ? "Latest uploaded batch" : "Sample dashboard data",
    },
    {
      title: "Total Transactions",
      value: totalTransactions,
      change: uploaded ? "Updated" : "8.2%",
      positive: true,
      icon: ShoppingBag,
      note: uploaded ? "Records in latest batch" : "Sample dashboard data",
    },
    {
      title: "Units Sold",
      value: totalUnits,
      change: uploaded ? "Updated" : "4.3%",
      positive: true,
      icon: Package,
      note: uploaded ? "Latest uploaded batch" : "Sample dashboard data",
    },
    {
      title: "Active Products",
      value: activeProducts,
      change: uploaded ? "Updated" : "2.1%",
      positive: true,
      icon: Users,
      note: uploaded ? "Products in latest batch" : "Sample dashboard data",
    },
  ];

  const navTo = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside
        className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}
      >
        <div className="brand">
          <div className="brand-icon">C</div>
          <span>
            Consumer<span className="brand-light">Pulse</span>
          </span>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`nav-item ${
                  activePage === item.label ? "active" : ""
                }`}
                onClick={() => navTo(item.label)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="workspace-label">PREFERENCES</div>

          <button className="nav-item">
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="profile-card">
            <div className="avatar">V</div>

            <div className="profile-info">
              <strong>Varun</strong>
              <span>Administrator</span>
            </div>

            <MoreHorizontal size={19} />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={21} />
            </button>

            <div>
              <div className="breadcrumb">
                Workspace / {activePage}
              </div>
              <h1>{activePage}</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <button className="icon-button" aria-label="Search">
              <Search size={19} />
            </button>

            <button
              className="icon-button notification"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span />
            </button>

            <div className="topbar-divider" />

            <button className="date-filter">
              <CalendarDays size={17} />
              <span>Last 7 days</span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        <section className="dashboard-body">
          {/* WELCOME SECTION */}
          <div className="welcome-row">
            <div>
              <h2>
                {activePage === "Data Upload"
                  ? "Upload your transaction data"
                  : "Business overview"}
              </h2>

              <p>
                {activePage === "Data Upload"
                  ? "Import your CSV and let ConsumerPulse analyse your business."
                  : "Here's what's happening with your business today."}
              </p>
            </div>

            <button
              className="upload-button"
              onClick={() => navTo("Data Upload")}
            >
              <Upload size={17} />
              Upload CSV
            </button>
          </div>

          {/* DATA UPLOAD PAGE */}
          {activePage === "Data Upload" && (
            <section
              className="panel"
              style={{
                padding: "28px",
                marginBottom: "24px",
              }}
            >
              <div className="panel-heading">
                <div>
                  <h3>Import transaction data</h3>
                  <p>
                    Upload a CSV file to process your sales records.
                  </p>
                </div>

                <FileSpreadsheet size={23} />
              </div>

              <div
                style={{
                  border: "2px dashed #cbd8d1",
                  borderRadius: "14px",
                  padding: "35px 20px",
                  textAlign: "center",
                  marginTop: "22px",
                }}
              >
                <FileSpreadsheet size={42} color="#16845e" />

                <h3 style={{ marginTop: "15px" }}>
                  Choose your transaction CSV
                </h3>

                <p
                  style={{
                    color: "#89939e",
                    marginBottom: "18px",
                  }}
                >
                  CSV format only · Maximum file size 10 MB
                </p>

                <input
                  key={fileInputKey}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                />

                <p
                  style={{
                    fontSize: "13px",
                    color: "#89939e",
                    marginTop: "15px",
                  }}
                >
                  Required columns: transaction_id, customer_id,
                  product_id, store_id, quantity, price,
                  transaction_date
                </p>
              </div>

              {/* SELECTED FILE */}
              {selectedFile && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    padding: "15px",
                    background: "#f1f8f4",
                    borderRadius: "10px",
                    marginTop: "18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <FileSpreadsheet color="#16845e" />

                    <div>
                      <strong>{selectedFile.name}</strong>

                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: "#89939e",
                        }}
                      >
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <button
                    className="icon-button"
                    onClick={resetUpload}
                    aria-label="Remove file"
                    disabled={uploading}
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              {/* UPLOAD ERROR */}
              {uploadError && (
                <div
                  style={{
                    color: "#c0392b",
                    marginTop: "18px",
                  }}
                >
                  <AlertCircle
                    size={17}
                    style={{ verticalAlign: "middle" }}
                  />{" "}
                  {uploadError}
                </div>
              )}

              {/* UPLOAD SUCCESS */}
              {uploadResult && (
                <div
                  style={{
                    background: "#f1f8f4",
                    padding: "18px",
                    borderRadius: "12px",
                    marginTop: "18px",
                  }}
                >
                  <h3 style={{ color: "#16845e" }}>
                    <CheckCircle2
                      size={19}
                      style={{ verticalAlign: "middle" }}
                    />{" "}
                    Upload processed successfully!
                  </h3>

                  <p>
                    Total records: {uploadResult.totalRecords}
                  </p>

                  <p>
                    Valid records: {uploadResult.validRecords}
                  </p>

                  <p>
                    Invalid records: {uploadResult.invalidRecords}
                  </p>

                  <p>
                    Issues stored: {uploadResult.issuesStored}
                  </p>

                  <p>
                    C++ analytics:{" "}
                    {uploadResult.cppAnalytics?.success
                      ? "Successful"
                      : "Check analytics output"}
                  </p>

                  {/* DAILY REVENUE FROM POSTGRESQL */}
                  {uploadResult.dailyRevenue?.length > 0 && (
                    <div style={{ marginTop: "18px" }}>
                      <strong>Daily revenue summary</strong>

                      {uploadResult.dailyRevenue.map((item) => (
                        <p key={item.date}>
                          {item.date}:{" "}
                          {formatCurrency(item.revenue)}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* C++ OUTPUT */}
                  {uploadResult.cppAnalytics?.output && (
                    <details style={{ marginTop: "12px" }}>
                      <summary>
                        View C++ analytics output
                      </summary>

                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          overflowX: "auto",
                          fontSize: "12px",
                        }}
                      >
                        {uploadResult.cppAnalytics.output}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* UPLOAD BUTTONS */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "22px",
                }}
              >
                <button
                  className="upload-button"
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <>
                      <LoaderCircle size={17} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={17} />
                      Upload and analyse
                    </>
                  )}
                </button>

                <button
                  className="text-button"
                  onClick={resetUpload}
                  disabled={uploading}
                >
                  Clear
                </button>
              </div>
            </section>
          )}

          {/* DASHBOARD PAGES */}
          {activePage !== "Data Upload" && (
            <>
              {/* DATA NOTICE */}
              <div className="demo-notice">
                <FileSpreadsheet size={17} />

                <span>
                  {uploaded
                    ? "Showing summary values and revenue trends from your latest uploaded batch."
                    : "Showing sample dashboard data. Upload a transaction CSV to view your business analytics."}
                </span>
              </div>

              {/* KPI CARDS */}
              <div className="stats-grid">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  const ChangeIcon = stat.positive
                    ? ArrowUpRight
                    : ArrowDownRight;

                  return (
                    <article
                      className="stat-card"
                      key={stat.title}
                    >
                      <div className="stat-top">
                        <span>{stat.title}</span>

                        <div className="stat-icon">
                          <Icon size={19} />
                        </div>
                      </div>

                      <div className="stat-value">
                        {stat.value}
                      </div>

                      <div className="stat-footer">
                        <span
                          className={
                            stat.positive ? "positive" : "negative"
                          }
                        >
                          {uploaded ? (
                            <CheckCircle2 size={15} />
                          ) : (
                            <ChangeIcon size={15} />
                          )}

                          {stat.change}
                        </span>

                        <span>{stat.note}</span>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* REVENUE CHART + QUICK INSIGHTS */}
              <div className="content-grid">
                <section className="panel revenue-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Revenue overview</h3>

                      <p>
                        {uploaded
                          ? "Daily revenue from your uploaded transactions"
                          : "Daily revenue performance (sample data)"}
                      </p>
                    </div>

                    <button
                      className="more-button"
                      aria-label="More options"
                    >
                      <MoreHorizontal size={21} />
                    </button>
                  </div>

                  <div className="chart-total">
                    <strong>
                      {formatCurrency(totalRevenue)}
                    </strong>

                    {!uploaded && (
                      <span className="positive">
                        <TrendingUp size={15} />
                        12.8%
                      </span>
                    )}
                  </div>

                  <div className="chart-container">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <AreaChart
                          data={chartData}
                          margin={{
                            top: 15,
                            right: 10,
                            left: -15,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="revenueGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#16a36a"
                                stopOpacity={0.2}
                              />

                              <stop
                                offset="100%"
                                stopColor="#16a36a"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            stroke="#edf0f2"
                            strokeDasharray="4 4"
                            vertical={false}
                          />

                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "#89939e",
                              fontSize: 12,
                            }}
                            dy={12}
                          />

                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "#89939e",
                              fontSize: 12,
                            }}
                            tickFormatter={(value) =>
                              `₹${Number(value).toLocaleString("en-IN")}`
                            }
                          />

                          <Tooltip
                            formatter={(value) => [
                              formatCurrency(value),
                              "Revenue",
                            ]}
                          />

                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#16a36a"
                            strokeWidth={2.5}
                            fill="url(#revenueGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <p
                        style={{
                          textAlign: "center",
                          padding: "40px 10px",
                          color: "#89939e",
                        }}
                      >
                        No daily revenue data available for this upload.
                      </p>
                    )}
                  </div>
                </section>

                {/* QUICK INSIGHTS */}
                <section className="panel insights-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Quick insights</h3>
                      <p>Highlights from your data</p>
                    </div>

                    <TrendingUp
                      size={19}
                      className="insight-heading-icon"
                    />
                  </div>

                  <div className="insight-item">
                    <div className="insight-icon green">
                      <TrendingUp size={18} />
                    </div>

                    <div>
                      <strong>Top revenue product</strong>

                      <p>
                        {topProduct
                          ? `${topProduct.id} generated ${formatCurrency(topProduct.revenue)} in revenue.`
                          : "No product data available."}
                      </p>
                    </div>
                  </div>

                  <div className="insight-item">
                    <div className="insight-icon blue">
                      <Package size={18} />
                    </div>

                    <div>
                      <strong>{totalUnits} units sold</strong>

                      <p>
                        Across {activeProducts} different products.
                      </p>
                    </div>
                  </div>

                  <div className="insight-item">
                    <div className="insight-icon orange">
                      <FileSpreadsheet size={18} />
                    </div>

                    <div>
                      <strong>Data quality</strong>

                      <p>
                        {validTransactions} of {totalTransactions}{" "}
                        records are valid.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* PRODUCT TABLE */}
              <section className="panel products-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Top performing products</h3>

                    <p>Ranked by total revenue</p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => navTo("Products")}
                  >
                    View all <ArrowUpRight size={15} />
                  </button>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th>PRODUCT ID</th>
                        <th>CATEGORY</th>
                        <th>QUANTITY SOLD</th>
                        <th>REVENUE</th>
                      </tr>
                    </thead>

                    <tbody>
                      {displayedProducts.length > 0 ? (
                        displayedProducts.map((product, index) => (
                          <tr key={product.id}>
                            <td>
                              <div className="product-name">
                                <div
                                  className={`product-avatar product-${index % 3}`}
                                >
                                  <Package size={17} />
                                </div>

                                <strong>{product.name}</strong>
                              </div>
                            </td>

                            <td>{product.id}</td>

                            <td>
                              <span className="category-tag">
                                {product.category}
                              </span>
                            </td>

                            <td>{product.quantity} units</td>

                            <td className="revenue-cell">
                              {formatCurrency(product.revenue)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">
                            No product analytics available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* FOOTER */}
          <footer className="dashboard-footer">
            <span>© 2026 ConsumerPulse Analytics</span>
            <span>Built for smarter business decisions.</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
