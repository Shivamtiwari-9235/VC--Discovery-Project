import { useEffect, useState } from "react";
import { API } from "../api";
import { Link } from "react-router-dom";
import { Search, MapPin, Building2, DollarSign } from "lucide-react";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ industry: "", location: "" });

  const sampleCompanies = [
    { _id: "1", name: "NeuralFlow AI", website: "https://neuralflow.ai", industry: "AI/ML", location: "San Francisco", funding: "$25M Series A" },
    { _id: "2", name: "PayStack Pro", website: "https://paystackpro.com", industry: "Fintech", location: "New York", funding: "$12M Series A" },
    { _id: "3", name: "CloudScale SaaS", website: "https://cloudscale.io", industry: "SaaS", location: "Austin", funding: "$8M Seed" },
    { _id: "4", name: "MedTech Vision", website: "https://medtechvision.com", industry: "Healthcare", location: "Seattle", funding: "$45M Series B" },
    { _id: "5", name: "Shopify Builder", website: "https://shopifybuilder.io", industry: "E-commerce", location: "San Francisco", funding: "$15M Series A" },
    { _id: "6", name: "DataMinds", website: "https://dataminds.ai", industry: "AI/ML", location: "Boston", funding: "$30M Series A" },
    { _id: "7", name: "SecurePay", website: "https://securepay.io", industry: "Fintech", location: "San Francisco", funding: "$18M Series A" },
    { _id: "8", name: "HealthSync", website: "https://healthsync.com", industry: "Healthcare", location: "New York", funding: "$22M Series A" },
  ];

  useEffect(() => {
    API.get("/companies")
      .then((res) => {
        setCompanies(res.data.length > 0 ? res.data : sampleCompanies);
        setLoading(false);
      })
      .catch(() => {
        setCompanies(sampleCompanies);
        setLoading(false);
      });
  }, []);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filters.industry === "" || c.industry === filters.industry) &&
    (filters.location === "" || c.location === filters.location)
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white border border-slate-200 rounded-xl p-4 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const industries = [...new Set(companies.map((c) => c.industry).filter(Boolean))];
  const locations = [...new Set(companies.map((c) => c.location).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discover Companies</h1>
          <p className="text-sm text-slate-500 mt-1">Find your next portfolio company</p>
        </div>
        <p className="text-sm text-slate-500">{filteredCompanies.length} companies found</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <select
            value={filters.industry}
            onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Industries</option>
            {industries.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
          <select
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Company</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Industry</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Funding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCompanies.map((company) => (
              <tr key={company._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <Link to={`/company/${company._id}`} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{company.name}</p>
                      <p className="text-xs text-slate-500">{company.website?.replace("https://", "")}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    <Building2 className="w-3 h-3" />
                    {company.industry}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {company.location}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    {company.funding}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCompanies.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-500">No companies found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
