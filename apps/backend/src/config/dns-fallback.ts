import * as dns from 'node:dns';

// Some local/corporate DNS resolvers refuse SRV lookups (required by mongodb+srv:// URIs).
// Fall back to public resolvers so MongoDB Atlas SRV records resolve correctly.
dns.setServers([...dns.getServers(), '8.8.8.8', '8.8.4.4']);
