export interface HotspotPortSpec {
  protocol: string;
  port: string;
  source: string;
  destination: string;
  purpose: string;
}

export interface DiagramHotspot {
  id: string;
  name: string;
  category: 'Appliance' | 'Network & Routing' | 'Compute & Cluster' | 'Storage Fabric' | 'Security & Firewall' | 'Interconnect';
  badge: string;
  xPercent: number; // 0 - 100
  yPercent: number; // 0 - 100
  shortDescription: string;
  fullDescription: string;
  role: string;
  trafficDirection: string;
  highAvailability: string;
  sizingAndConstraints: string;
  portsTable: HotspotPortSpec[];
  troubleshootingCli: {
    command: string;
    context: string;
    expectedOutput: string;
  }[];
  packetFlowSummary: string;
  relatedComponents?: string[];
}

export const DIAGRAM_HOTSPOTS_COLLECTION: Record<string, DiagramHotspot[]> = {
  // ==========================================
  // 1. AZURE VMWARE SOLUTION (AVS) SUBSECTIONS
  // ==========================================

  // AVS Design 1: ExpressRoute FastPath & Hub-Spoke VNet Transit
  'avs-design-1': [
    {
      id: 'avs1-msee',
      name: 'MSEE ExpressRoute Edge Routers',
      category: 'Interconnect',
      badge: 'FastPath Ingress',
      xPercent: 18,
      yPercent: 36,
      shortDescription: 'Microsoft Enterprise Edge (MSEE) carrier routers providing physical ExpressRoute termination.',
      fullDescription: 'Dual MSEE routers terminate private peering for Azure VMware Solution. With FastPath enabled, packet frames are routed directly from physical NICs to AVS ESXi host interfaces, bypassing GatewaySubnet CPU limits to deliver line-rate 10G/100G throughput with sub-millisecond latency.',
      role: 'ExpressRoute Border Carrier Termination',
      trafficDirection: 'Bidirectional low-latency hybrid traffic',
      highAvailability: 'Active/Active dual MSEE physical chassis with automated BGP failover.',
      sizingAndConstraints: '10 Gbps to 100 Gbps bandwidth; requires ErGw3AZ or UltraPerformance gateway with FastPath.',
      portsTable: [
        { protocol: 'BGP', port: '179', source: 'On-Premises Edge', destination: 'MSEE-1 & MSEE-2', purpose: 'Dual BGP peering sessions' }
      ],
      troubleshootingCli: [
        { command: 'az network express-route gateway show -g <rg> -n <gw-name> --query "allowGatewayFastPath"', context: 'Verify FastPath flag on Azure Gateway', expectedOutput: 'true' }
      ],
      packetFlowSummary: 'Packets leave on-premises edge -> land on MSEE router -> FastPath hardware switches directly to AVS ESXi physical NICs without intermediate Gateway hops.'
    },
    {
      id: 'avs1-route-server',
      name: 'Azure Route Server & Hub NVA',
      category: 'Network & Routing',
      badge: 'BGP Broker',
      xPercent: 46,
      yPercent: 28,
      shortDescription: 'Dynamic BGP router injecting routes between Hub NVA firewalls and AVS SDDC.',
      fullDescription: 'Azure Route Server exchanges routes dynamically via BGP between third-party firewall/NVA appliances in the Hub VNet and the AVS NSX-T Edge routers, eliminating the need to manually maintain static User Defined Routes (UDRs).',
      role: 'Dynamic Route Broker',
      trafficDirection: 'Control-plane BGP route updates',
      highAvailability: 'Managed regional multi-zone deployment with automated failover.',
      sizingAndConstraints: 'Supports up to 1000 routes advertised into VNet route table.',
      portsTable: [
        { protocol: 'TCP', port: '179', source: 'Hub NVA Firewall', destination: 'Azure Route Server VIP', purpose: 'eBGP route advertisement' }
      ],
      troubleshootingCli: [
        { command: 'az network routeserver peering list-learned-routes -g <rg> --routeserver <rs-name> -n <peering-name>', context: 'Query active BGP routes learned from AVS NSX-T Edge', expectedOutput: '[{"network": "192.168.0.0/16", "nextHop": "10.0.1.4"}]' }
      ],
      packetFlowSummary: 'Route Server injects BGP routes into VNet fabric -> Spoke VNets forward traffic directly to target firewall or AVS NSX Edge.'
    },
    {
      id: 'avs1-t0-edge',
      name: 'AVS NSX-T Tier-0 Gateway',
      category: 'Network & Routing',
      badge: 'SDDC Edge',
      xPercent: 68,
      yPercent: 44,
      shortDescription: 'Active/Active Tier-0 edge cluster terminating AVS private cloud north-south routing.',
      fullDescription: 'Dual NSX-T Tier-0 Edge VMs peer with the Azure ExpressRoute circuit over dedicated /29 transit interconnect subnets, providing Equal-Cost Multi-Path (ECMP) routing and BGP metric control into the Azure backbone.',
      role: 'AVS Private Cloud North-South Gateway',
      trafficDirection: 'North-south traffic between guest VMs and Azure / on-premises',
      highAvailability: 'Active/Active stateful edge cluster with automated health-check failover.',
      sizingAndConstraints: 'Default large Edge VM profile supporting 10 Gbps+ per tier.',
      portsTable: [
        { protocol: 'BGP', port: '179', source: 'NSX-T Edge Node', destination: 'MSEE Router IP', purpose: 'eBGP peering session' }
      ],
      troubleshootingCli: [
        { command: 'get logical-router <t0-id> bgp neighbor summary', context: 'Inspect NSX-T Edge BGP status', expectedOutput: 'Neighbor: 10.0.0.1, State: Established, Up/Down: 14d' }
      ],
      packetFlowSummary: 'Overlay Geneve traffic from ESXi hosts is decapsulated by Tier-0 Edge -> routed natively into Azure ExpressRoute peering.'
    },
    {
      id: 'avs1-sddc-core',
      name: 'AVS AV36 / AV64 Cluster Nodes',
      category: 'Compute & Cluster',
      badge: 'Bare-Metal Core',
      xPercent: 82,
      yPercent: 48,
      shortDescription: 'Dedicated bare-metal ESXi hypervisors in Azure data center cages.',
      fullDescription: 'Enterprise VMware vSphere, vSAN, and NSX-T running on dedicated physical hardware (AV36, AV52, AV64). Hosts feature dual 25GbE Mellanox NICs partitioned for vSphere management, vSAN, vMotion, and NSX overlay encapsulation.',
      role: 'Private Cloud Compute & Storage Execution',
      trafficDirection: 'Internal cluster mesh & North-South routing via NSX Tier-0',
      highAvailability: 'vSphere HA with automated host restart and hot-spare node replacement within minutes.',
      sizingAndConstraints: 'Minimum 3 nodes per cluster, scaling up to 16 nodes per cluster.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'Azure Portal / Bastion', destination: 'AVS vCenter Server', purpose: 'vSphere Management UI' }
      ],
      troubleshootingCli: [
        { command: 'az vmware private-cloud show -g <rg> -n <pc-name> --query "managementClusters[0].clusterSize"', context: 'Check current bare-metal host allocation', expectedOutput: '4' }
      ],
      packetFlowSummary: 'Executes enterprise virtual machines with local NVMe vSAN storage and direct NSX overlay connectivity.'
    }
  ],

  // AVS Design 2: Azure NetApp Files (ANF) Decoupled Storage Pool
  'avs-design-2': [
    {
      id: 'avs2-esxi-nfs',
      name: 'AVS ESXi vmknic NFS Initiators',
      category: 'Compute & Cluster',
      badge: 'NFS Client Kernel',
      xPercent: 22,
      yPercent: 42,
      shortDescription: 'Dedicated ESXi VMkernel interfaces (vmk3) optimized for high-bandwidth NFSv3 datastores.',
      fullDescription: 'Configured on isolated subnets with optimized TCP window sizing and MTU 1500/9000, ensuring dedicated bandwidth allocation for NFS datastore I/O without competing against guest VM payload traffic.',
      role: 'NFS Storage Initiator',
      trafficDirection: 'NFSv3 storage read/write requests to ANF volume endpoints',
      highAvailability: 'Multi-NIC vSphere teaming with active/standby failover.',
      sizingAndConstraints: 'Requires dedicated IP pool per ESXi host.',
      portsTable: [
        { protocol: 'TCP', port: '2049', source: 'ESXi vmk3', destination: 'ANF Target IP', purpose: 'NFSv3 storage read/write' },
        { protocol: 'TCP', port: '111', source: 'ESXi vmk3', destination: 'ANF Target IP', purpose: 'Portmapper / rpcbind' }
      ],
      troubleshootingCli: [
        { command: 'esxcli storage nfs list', context: 'List mounted ANF datastores on ESXi CLI', expectedOutput: 'ds-anf-ultra-01: Mounted, Accessible' }
      ],
      packetFlowSummary: 'VM issues storage write -> ESXi kernel sends NFSv3 packets across ExpressRoute FastPath dedicated storage subnet -> ANF answers in < 1.2ms.'
    },
    {
      id: 'avs2-fastpath-storage',
      name: 'ExpressRoute FastPath Storage Fabric',
      category: 'Interconnect',
      badge: 'Zero-Jitter Transit',
      xPercent: 48,
      yPercent: 36,
      shortDescription: 'Sub-millisecond dedicated network path connecting AVS ESXi kernel directly to ANF subnets.',
      fullDescription: 'Dedicated delegated subnet in Azure Hub VNet cross-connected via ExpressRoute UltraPerformance gateway, ensuring storage packets travel at hardware wire speeds without gateway buffering or packet queuing.',
      role: 'Storage Transport Highway',
      trafficDirection: 'Dedicated NFS traffic isolated from guest VM network streams',
      highAvailability: 'Redundant dual paths with multi-pathing resilience.',
      sizingAndConstraints: 'Requires MTU alignment (1500 or 9000 bytes).',
      portsTable: [
        { protocol: 'TCP', port: '2049', source: 'AVS ESXi vmknic', destination: 'ANF Subnet', purpose: 'NFS storage transport' }
      ],
      troubleshootingCli: [
        { command: 'vmkping -d -s 1472 -I vmk3 <anf-ip>', context: 'Verify MTU path and ping latency to ANF storage target', expectedOutput: '64 bytes from <anf-ip>: time=0.9 ms' }
      ],
      packetFlowSummary: 'NFS traffic is routed with priority QoS over FastPath directly into the ANF storage controllers.'
    },
    {
      id: 'avs2-anf-pool',
      name: 'Azure NetApp Files (ANF) Capacity Pool',
      category: 'Storage Fabric',
      badge: 'NFS Datastore',
      xPercent: 76,
      yPercent: 38,
      shortDescription: 'Decoupled high-performance external NFSv3 datastores mounted directly to AVS ESXi clusters.',
      fullDescription: 'Azure NetApp Files (ANF) datastores decouple storage capacity from compute nodes. Organizations with high capacity storage requirements (file servers, databases, archives) can scale storage without purchasing expensive AV36/AV64 nodes, lowering overall TCO by up to 38%.',
      role: 'External NFSv3 Storage Target',
      trafficDirection: 'NFSv3 block/file read-writes between AVS ESXi kernel and ANF controllers',
      highAvailability: 'Enterprise dual-controller architecture with 99.99% SLA and optional Cross-Region Replication (CRR).',
      sizingAndConstraints: 'Standard, Premium, and Ultra performance tiers (up to 128 MiB/s per allocated TB).',
      portsTable: [
        { protocol: 'TCP', port: '2049', source: 'AVS ESXi vmknic', destination: 'ANF Volume IP', purpose: 'NFSv3 storage operations' }
      ],
      troubleshootingCli: [
        { command: 'az netappfiles volume show -g <rg> -a <acc> -p <pool> -v <vol> --query "provisioningState"', context: 'Check ANF volume status in Azure CLI', expectedOutput: '"Succeeded"' }
      ],
      packetFlowSummary: 'Writes are committed into NVRAM cache on active storage controller, synchronously mirrored, then acknowledged to ESXi.'
    },
    {
      id: 'avs2-snapshot-engine',
      name: 'ANF Snapshot & Replication Engine',
      category: 'Storage Fabric',
      badge: 'Instant Recovery',
      xPercent: 78,
      yPercent: 70,
      shortDescription: 'Near-instantaneous volume snapshots and cross-region replication for zero-RTO recovery.',
      fullDescription: 'Provides point-in-time snapshot copies in seconds without consuming compute cycles or causing VM disk stuns, with automated asynchronous volume replication to a secondary Azure paired region.',
      role: 'Storage Protection & Secondary Disaster Mirror',
      trafficDirection: 'Back-end Azure storage replication traffic',
      highAvailability: 'Cross-zone and cross-region replication SLAs.',
      sizingAndConstraints: 'Up to 255 snapshots per volume with scheduled policy automation.',
      portsTable: [
        { protocol: 'HTTPS', port: '443', source: 'Azure Automation', destination: 'ANF Management API', purpose: 'Snapshot policy execution' }
      ],
      troubleshootingCli: [
        { command: 'az netappfiles snapshot list -g <rg> -a <acc> -p <pool> -v <vol>', context: 'Verify latest automated ANF storage snapshot', expectedOutput: '[{"provisioningState": "Succeeded"}]' }
      ],
      packetFlowSummary: 'Block pointer updates capture instant volume states without copying blocks, enabling zero-impact backups.'
    }
  ],

  // AVS Design 3: Multi-AZ Stretched SDDC & Global Route Resilience
  'avs-design-3': [
    {
      id: 'avs3-az1-cluster',
      name: 'Availability Zone 1 AVS Cluster',
      category: 'Compute & Cluster',
      badge: 'Primary Zone',
      xPercent: 24,
      yPercent: 48,
      shortDescription: 'Primary bare-metal cluster partition hosted in Azure Availability Zone 1.',
      fullDescription: 'Participates in synchronous vSAN storage mirroring across zones. Sub-2ms RTT latency boundary enforced across primary and secondary Azure AZs ensures zero transactional data loss (RPO = 0).',
      role: 'Zone 1 Compute & Storage Replica',
      trafficDirection: 'Synchronous vSAN mirroring across inter-zone dark fiber',
      highAvailability: 'vSphere HA with automated restart of virtual machines in surviving zone.',
      sizingAndConstraints: 'Symmetric node allocation between AZ 1 and AZ 2.',
      portsTable: [
        { protocol: 'TCP', port: '12321', source: 'AZ-1 ESXi Node', destination: 'AZ-2 ESXi Node', purpose: 'vSAN synchronous clustering daemon' }
      ],
      troubleshootingCli: [
        { command: 'esxcli vsan cluster get', context: 'Inspect stretched cluster health and node count', expectedOutput: 'Sub-Cluster Health: OK, Stretched Cluster: Enabled' }
      ],
      packetFlowSummary: 'Write request from guest OS is committed synchronously to both AZ-1 and AZ-2 vSAN nodes before acknowledgment.'
    },
    {
      id: 'avs3-witness',
      name: 'Cloud Witness Arbitrator (AZ-3)',
      category: 'Appliance',
      badge: 'Quorum Guardian',
      xPercent: 50,
      yPercent: 18,
      shortDescription: 'Witness virtual appliance maintaining quorum in an independent third Azure zone.',
      fullDescription: 'The vSAN Witness appliance acts as a neutral tie-breaker if network connectivity between Availability Zone 1 and Zone 2 is severed, preventing split-brain conditions and arbitrating cluster ownership.',
      role: 'Split-Brain Prevention & Quorum Broker',
      trafficDirection: 'Low-bandwidth witness metadata heartbeats (< 100 Kbps)',
      highAvailability: 'Independent zone deployment guaranteeing survivability.',
      sizingAndConstraints: 'Requires RTT < 50ms from primary zones.',
      portsTable: [
        { protocol: 'UDP', port: '1234', source: 'AZ Hosts', destination: 'Witness Appliance', purpose: 'Cluster heartbeat and quorum exchange' }
      ],
      troubleshootingCli: [
        { command: 'esxcli vsan health cluster list | grep -i witness', context: 'Verify witness connectivity state', expectedOutput: 'Witness node communication: Healthy' }
      ],
      packetFlowSummary: 'Receives lightweight cluster heartbeats; decides active cluster ownership if an AZ partition event occurs.'
    },
    {
      id: 'avs3-az2-cluster',
      name: 'Availability Zone 2 AVS Cluster',
      category: 'Compute & Cluster',
      badge: 'Secondary Zone',
      xPercent: 76,
      yPercent: 48,
      shortDescription: 'Secondary synchronous cluster partition hosted in Azure Availability Zone 2.',
      fullDescription: 'Mirrors all storage writes across dual availability zones. If Zone 1 suffers a catastrophic power or facility failure, vSphere HA automatically re-boots workloads in Zone 2 with zero lost transactions.',
      role: 'Zone 2 Synchronous Standby & Execution Site',
      trafficDirection: 'Synchronous write mirroring and live vSphere DRS migration',
      highAvailability: 'Zero-RPO synchronous failover target.',
      sizingAndConstraints: 'Symmetric hardware capacity matched to Zone 1.',
      portsTable: [
        { protocol: 'TCP', port: '8000', source: 'AZ-1 ESXi Node', destination: 'AZ-2 ESXi Node', purpose: 'vSphere vMotion over inter-zone link' }
      ],
      troubleshootingCli: [
        { command: 'az vmware private-cloud show -g <rg> -n <pc-name> --query "availability"', context: 'Verify AVS multi-zone status', expectedOutput: '{"strategy": "DualZone"}' }
      ],
      packetFlowSummary: 'Maintains identical real-time storage blocks, ready to take over guest execution instantly.'
    },
    {
      id: 'avs3-interzone-mesh',
      name: 'Inter-AZ Ultra Low Latency Dark Fiber',
      category: 'Interconnect',
      badge: 'Sub-2ms Link',
      xPercent: 50,
      yPercent: 64,
      shortDescription: 'Dedicated dark fiber mesh providing sub-2 millisecond round-trip latency between AZ-1 and AZ-2.',
      fullDescription: 'Carries high-throughput synchronous vSAN I/O, inter-zone vMotion, and NSX Geneve overlay transport frames with dedicated SLA guarantees.',
      role: 'Synchronous Replication Highway',
      trafficDirection: 'Inter-zone bidirectional storage & cluster sync',
      highAvailability: 'Diverse routed paths with automatic link failover.',
      sizingAndConstraints: 'Round-trip time strictly constrained to < 2.0ms.',
      portsTable: [
        { protocol: 'Geneve', port: '6081', source: 'AZ-1 TEP', destination: 'AZ-2 TEP', purpose: 'Inter-AZ NSX overlay transport' }
      ],
      troubleshootingCli: [
        { command: 'vmkping -d -s 8972 -I vmk1 <az2-vsan-ip>', context: 'Test jumbo frame latency between zones', expectedOutput: 'time=1.1 ms' }
      ],
      packetFlowSummary: 'Guarantees sub-2ms RTT packet transmission for synchronous writes before database transactions commit.'
    }
  ],

  // ==========================================
  // 2. GOOGLE CLOUD VMWARE ENGINE (GCVE)
  // ==========================================

  // GCVE Design 1: Private Services Access & Cloud Interconnect
  'gcve-design-1': [
    {
      id: 'gcve1-interconnect',
      name: 'Google Cloud Interconnect (100G Link)',
      category: 'Interconnect',
      badge: '100G Hybrid Link',
      xPercent: 18,
      yPercent: 42,
      shortDescription: 'Carrier-grade physical connection linking on-premises to Google Cloud network.',
      fullDescription: 'Dedicated or Partner Cloud Interconnect terminating with dual 10G/100G links and redundant eBGP sessions, providing deterministic latency, 99.99% SLA availability, and enterprise hybrid reachability.',
      role: 'High-Speed Physical Hybrid Transport',
      trafficDirection: 'Bidirectional enterprise traffic',
      highAvailability: '99.99% availability via dual metro Cloud Interconnect attachments.',
      sizingAndConstraints: '10 Gbps to 100 Gbps circuits; supports VLAN attachments.',
      portsTable: [
        { protocol: 'BGP', port: '179', source: 'On-Premises Edge', destination: 'Google Cloud Router', purpose: 'Dynamic BGP route advertisement' }
      ],
      troubleshootingCli: [
        { command: 'gcloud compute interconnects list', context: 'Check interconnect operational state', expectedOutput: 'NAME: dedicated-interconnect-01, OPERATIONAL_STATUS: OS_ACTIVE' }
      ],
      packetFlowSummary: 'On-premises frames enter Cloud Interconnect -> routed through Google Andromeda SDN directly to GCVE Edge.'
    },
    {
      id: 'gcve1-psa',
      name: 'Private Services Access (PSA) Peering',
      category: 'Network & Routing',
      badge: 'Zero-NAT Peering',
      xPercent: 46,
      yPercent: 32,
      shortDescription: 'High-speed private connection between GCVE tenant project and customer VPC.',
      fullDescription: 'Private Services Access establishes a private connection between customer VPC network and the GCVE managed service network. Routes are automatically exchanged through VPC Network Peering with custom route import/export enabled, eliminating the need for NAT or VPN gateways.',
      role: 'Zero-NAT Route Mesh',
      trafficDirection: 'Bidirectional private IP communication between GCVE and GCP VPC',
      highAvailability: 'Redundant Google SDN fabric with automated fault domain isolation.',
      sizingAndConstraints: 'Requires a dedicated non-overlapping /22 to /24 IP CIDR allocated for GCVE management.',
      portsTable: [
        { protocol: 'IP / BGP', port: '179', source: 'GCVE Cloud Router', destination: 'Customer Cloud Router', purpose: 'Custom route import/export BGP peering' }
      ],
      troubleshootingCli: [
        { command: 'gcloud compute networks peerings list --network=<vpc-name>', context: 'Verify GCVE peering status in gcloud CLI', expectedOutput: 'state: ACTIVE, exportCustomRoutes: true, importCustomRoutes: true' }
      ],
      packetFlowSummary: 'GCVE VM communicates with customer VPC VMs over private Google backbone without crossing the public internet.'
    },
    {
      id: 'gcve1-t0-gateway',
      name: 'GCVE NSX-T Tier-0 Gateway',
      category: 'Network & Routing',
      badge: 'SDDC Gateway',
      xPercent: 68,
      yPercent: 36,
      shortDescription: 'High-availability NSX-T Edge router terminating GCVE overlay networks.',
      fullDescription: 'Peers dynamically via BGP with Google Cloud Router across redundant VLAN interfaces, enabling bidirectional route propagation between cloud VPC subnets and VMware overlay workloads.',
      role: 'GCVE Edge Routing Engine',
      trafficDirection: 'North-South traffic entering and leaving GCVE SDDC',
      highAvailability: 'Active/Active ECMP cluster running on bare-metal hypervisors.',
      sizingAndConstraints: 'Supports 10 Gbps+ per tier with line-rate BGP convergence.',
      portsTable: [
        { protocol: 'BGP', port: '179', source: 'GCVE Edge', destination: 'Google Cloud Router', purpose: 'BGP routing session' }
      ],
      troubleshootingCli: [
        { command: 'gcloud vmware private-clouds show <pc-name> --location=<region>', context: 'Check private cloud state in gcloud CLI', expectedOutput: 'state: ACTIVE' }
      ],
      packetFlowSummary: 'Decapsulates Geneve frames and routes natively into Google Andromeda virtual network.'
    },
    {
      id: 'gcve1-node-pool',
      name: 'GCVE Bare-Metal Node Pool (ve1-standard-72)',
      category: 'Compute & Cluster',
      badge: 'Bare-Metal Fleet',
      xPercent: 82,
      yPercent: 56,
      shortDescription: 'Dedicated Google Cloud bare-metal servers executing vSphere, vSAN, and NSX-T.',
      fullDescription: 'Custom dual-socket Intel Xeon nodes with 72 hyperthreaded cores, 768 GB RAM, and all-NVMe vSAN datastore tier. Directly connected to Google Cloud private 100G physical network mesh.',
      role: 'Private Cloud Workload Execution',
      trafficDirection: 'Guest compute execution and high-speed vSAN clustering',
      highAvailability: '99.99% availability SLA with automated node replacement.',
      sizingAndConstraints: '3 to 16 nodes per cluster, scaling up to multiple clusters.',
      portsTable: [
        { protocol: 'HTTPS', port: '443', source: 'Admin Bastion', destination: 'GCVE vCenter IP', purpose: 'vCenter web client access' }
      ],
      troubleshootingCli: [
        { command: 'gcloud vmware clusters list --private-cloud=<pc-name> --location=<region>', context: 'List bare-metal cluster hosts', expectedOutput: 'NAME: management-cluster, NODE_COUNT: 4, STATE: ACTIVE' }
      ],
      packetFlowSummary: 'Executes mission-critical enterprise workloads with zero hypervisor oversubscription.'
    }
  ],

  // GCVE Design 2: Google Cloud NetApp Volumes (GCNV)
  'gcve-design-2': [
    {
      id: 'gcve2-esxi-fleet',
      name: 'GCVE ESXi Hypervisor Fleet',
      category: 'Compute & Cluster',
      badge: 'Compute Consumers',
      xPercent: 24,
      yPercent: 44,
      shortDescription: 'Dedicated ESXi hosts mounting external GCNV NFS datastores via dedicated vmknics.',
      fullDescription: 'Mounts Google Cloud NetApp Volumes datastores directly over VPC peering without traversing NAT gateways or internet firewalls, expanding available datastore capacity elastically.',
      role: 'NFS Storage Client',
      trafficDirection: 'NFSv3 read/write I/O over Google Cloud private VPC peering link',
      highAvailability: 'Redundant NIC teaming across all cluster hypervisors.',
      sizingAndConstraints: 'Supports multi-terabyte NFS datastore mounts across 16 hosts.',
      portsTable: [
        { protocol: 'TCP', port: '2049', source: 'GCVE ESXi Host', destination: 'GCNV Storage Endpoint', purpose: 'NFSv3 storage mount & IOPS' }
      ],
      troubleshootingCli: [
        { command: 'esxcli storage nfs list', context: 'List mounted GCNV volumes on ESXi host CLI', expectedOutput: 'ds-gcnv-extreme-01: Mounted: true, Accessible: true' }
      ],
      packetFlowSummary: 'ESXi hosts mount GCNV volume over private VPC peering -> read/write operations execute with sub-millisecond IOPS.'
    },
    {
      id: 'gcve2-psa-storage',
      name: 'Private Services Access Storage Transit',
      category: 'Interconnect',
      badge: 'Zero-Egress Pipe',
      xPercent: 50,
      yPercent: 36,
      shortDescription: 'High-speed Google Andromeda SDN pipe routing NFS traffic directly to NetApp storage controllers.',
      fullDescription: 'Transits high-throughput storage traffic between GCVE tenant network and the managed NetApp service project with 0 egress cost within the region.',
      role: 'Storage Transport Highway',
      trafficDirection: 'Dedicated NFS storage packets',
      highAvailability: 'Redundant SDN multi-pathing.',
      sizingAndConstraints: 'Line-rate throughput up to 100 Gbps.',
      portsTable: [
        { protocol: 'TCP', port: '2049', source: 'GCVE Subnet', destination: 'GCNV Service Subnet', purpose: 'NFSv3 payload transit' }
      ],
      troubleshootingCli: [
        { command: 'gcloud compute networks subnets list --network=<vpc-name>', context: 'Verify storage subnet allocation', expectedOutput: 'READY' }
      ],
      packetFlowSummary: 'Provides zero-latency direct routing between ESXi vmknics and NetApp volume controllers.'
    },
    {
      id: 'gcve2-gcnv',
      name: 'Google Cloud NetApp Volumes (GCNV)',
      category: 'Storage Fabric',
      badge: 'NFS Storage Pool',
      xPercent: 76,
      yPercent: 42,
      shortDescription: 'Fully managed enterprise NFSv3 external datastores for GCVE compute clusters.',
      fullDescription: 'Google Cloud NetApp Volumes delivers high-throughput, low-latency file storage certified as external datastores for GCVE. Provides multiprotocol file access, instantaneous snapshots, and enterprise data protection for mission-critical databases.',
      role: 'External NFS Datastore Target',
      trafficDirection: 'NFSv3 over Google Cloud private VPC peering link',
      highAvailability: 'Zone-redundant storage arrays with automated failover and 99.99% availability.',
      sizingAndConstraints: 'Tiers: Standard (16 MiB/s/TB), Premium (64 MiB/s/TB), Extreme (128 MiB/s/TB).',
      portsTable: [
        { protocol: 'TCP', port: '2049', source: 'GCVE ESXi Host', destination: 'GCNV Storage Endpoint', purpose: 'NFSv3 storage mount & IOPS' }
      ],
      troubleshootingCli: [
        { command: 'gcloud netapp storage-pools list --location=<region>', context: 'List active GCNV storage pools', expectedOutput: 'SERVICE_LEVEL: EXTREME, CAPACITY_GIB: 10240, STATE: READY' }
      ],
      packetFlowSummary: 'Read and write requests are cached on SSD controllers and acknowledged with sub-millisecond latency.'
    },
    {
      id: 'gcve2-snapshot',
      name: 'GCNV Automated Snapshot & Cloner',
      category: 'Storage Fabric',
      badge: 'Zero-Impact Clones',
      xPercent: 78,
      yPercent: 68,
      shortDescription: 'Automated volume snapshot schedules and instant database cloning without data duplication.',
      fullDescription: 'Enables rapid creation of development and test environments by cloning multi-terabyte datastores in seconds using metadata pointers, with scheduled hourly snapshot protection.',
      role: 'Storage Protection & Clone Automation',
      trafficDirection: 'Internal controller metadata manipulation',
      highAvailability: 'Enterprise NetApp WAFL architecture.',
      sizingAndConstraints: 'Instantaneous snapshot creation and recovery.',
      portsTable: [
        { protocol: 'HTTPS', port: '443', source: 'Google Cloud Console', destination: 'NetApp API', purpose: 'Snapshot policy execution' }
      ],
      troubleshootingCli: [
        { command: 'gcloud netapp volumes snapshots list --volume=<vol-name> --location=<region>', context: 'Verify GCNV snapshot existence', expectedOutput: 'STATE: READY' }
      ],
      packetFlowSummary: 'Pointers are frozen instantaneously; newly written blocks are written to alternate storage blocks without freezing VM I/O.'
    }
  ],

  // GCVE Design 3: BigQuery & Vertex AI Analytics Pipeline
  'gcve-design-3': [
    {
      id: 'gcve3-db-vms',
      name: 'GCVE Production Database VMs',
      category: 'Compute & Cluster',
      badge: 'OLTP Data Source',
      xPercent: 22,
      yPercent: 46,
      shortDescription: 'Mission-critical SQL Server, Oracle, and PostgreSQL workloads hosted on GCVE bare-metal nodes.',
      fullDescription: 'Runs high-performance transactional applications with dedicated compute and NVMe storage. Connects via private endpoints to Google Cloud native AI and data services for modern analytics.',
      role: 'Production Database Server',
      trafficDirection: 'Outbound analytics extraction queries to BigQuery and Vertex AI',
      highAvailability: 'vSphere HA, DRS, and application-level clustering.',
      sizingAndConstraints: 'High CPU/RAM allocation with low latency network interfaces.',
      portsTable: [
        { protocol: 'TCP', port: '1433 / 1521', source: 'Application Tier', destination: 'DB Virtual Machine', purpose: 'OLTP transaction processing' }
      ],
      troubleshootingCli: [
        { command: 'curl -kv https://bigquery.googleapis.com', context: 'Verify direct HTTPS reachability to BigQuery API', expectedOutput: 'Connected to bigquery.googleapis.com port 443' }
      ],
      packetFlowSummary: 'Data extraction agents read transaction logs and stream structured events to private Google Cloud API endpoints.'
    },
    {
      id: 'gcve3-psc',
      name: 'Private Service Connect (PSC) Gateway',
      category: 'Interconnect',
      badge: 'Private PaaS Link',
      xPercent: 48,
      yPercent: 34,
      shortDescription: 'Private endpoint connecting GCVE virtual machines directly to Google BigQuery and Vertex AI.',
      fullDescription: 'Enables enterprise workloads inside GCVE to securely query BigQuery data warehouses and invoke Vertex AI model inference endpoints via private IP addresses without leaving Google Cloud private network.',
      role: 'Secure PaaS API Bridge',
      trafficDirection: 'Outbound HTTPS API calls to Google Cloud PaaS services',
      highAvailability: 'Distributed Google Cloud endpoint with automated multi-zone failover.',
      sizingAndConstraints: 'Supports unlimited concurrent streaming connections with 0 data egress fees.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'GCVE Application VM', destination: 'PSC Endpoint VIP', purpose: 'BigQuery & Vertex AI API queries' }
      ],
      troubleshootingCli: [
        { command: 'gcloud compute forwarding-rules list', context: 'Verify PSC forwarding rule endpoint', expectedOutput: 'TARGET: all-apis, IP_ADDRESS: 10.10.10.100, STATUS: OK' }
      ],
      packetFlowSummary: 'VM sends query to internal PSC IP -> Google network routes directly to BigQuery analytics engine.'
    },
    {
      id: 'gcve3-bigquery',
      name: 'Google BigQuery Serverless Warehouse',
      category: 'Storage Fabric',
      badge: 'PaaS Data Warehouse',
      xPercent: 76,
      yPercent: 28,
      shortDescription: 'Serverless enterprise data warehouse ingesting GCVE change data capture (CDC) streams.',
      fullDescription: 'Analyzes petabytes of structured and semi-structured operational data in seconds. Native Datastream connectors replicate VMware database tables directly into BigQuery datasets with sub-second replication latency.',
      role: 'Enterprise Analytics Engine',
      trafficDirection: 'High-bandwidth streaming ingestion and analytical query responses',
      highAvailability: 'Multi-region automated replication with 99.99% availability.',
      sizingAndConstraints: 'Autoscaling slot allocation processing petabytes on demand.',
      portsTable: [
        { protocol: 'HTTPS', port: '443', source: 'GCVE Data Agent', destination: 'BigQuery Storage API', purpose: 'Streaming data ingestion' }
      ],
      troubleshootingCli: [
        { command: 'bq show --dataset <project>:<dataset>', context: 'Verify dataset ingestion health in BigQuery CLI', expectedOutput: 'Dataset: operational_telemetry, Status: OK' }
      ],
      packetFlowSummary: 'Data is partitioned and columnar-compressed across thousands of Google Borg workers in real-time.'
    },
    {
      id: 'gcve3-vertex-ai',
      name: 'Vertex AI Foundation Models & Endpoints',
      category: 'Appliance',
      badge: 'AI/ML Inference',
      xPercent: 78,
      yPercent: 64,
      shortDescription: 'Enterprise machine learning models generating real-time predictive insights from GCVE data.',
      fullDescription: 'Workloads inside GCVE invoke Vertex AI endpoints to perform generative AI reasoning, sentiment scoring, and automated document analysis over internal private IP interconnects with zero internet exposure.',
      role: 'Generative AI & Machine Learning Acceleration',
      trafficDirection: 'Low-latency REST / gRPC inference calls from GCVE applications',
      highAvailability: 'Managed Google AI infrastructure with autoscaling model replicas.',
      sizingAndConstraints: 'Sub-15ms inference latency for embedded feature scoring.',
      portsTable: [
        { protocol: 'gRPC / HTTPS', port: '443', source: 'GCVE App VM', destination: 'Vertex AI Model VIP', purpose: 'Model inference request' }
      ],
      troubleshootingCli: [
        { command: 'gcloud ai endpoints list --region=<region>', context: 'Check active Vertex AI model endpoint', expectedOutput: 'DISPLAY_NAME: enterprise-fraud-detector, DEPLOYED_MODELS: 2' }
      ],
      packetFlowSummary: 'VM sends features via gRPC -> Vertex AI evaluates tensor graph -> returns predicted labels in milliseconds.'
    }
  ],

  // ==========================================
  // 3. VMWARE CLOUD ON AWS (VMC)
  // ==========================================

  // VMC Design 1: Multi-AZ Stretched Cluster & vSAN Mirror
  'vmc-design-1': [
    {
      id: 'vmc1-dx',
      name: 'AWS Direct Connect (DX) + DXGW',
      category: 'Interconnect',
      badge: 'Dedicated Transport',
      xPercent: 20,
      yPercent: 35,
      shortDescription: 'Physical dedicated carrier connection terminating in AWS Direct Connect Gateway.',
      fullDescription: 'Provides dedicated 1G to 100G hybrid bandwidth between on-premises enterprise data centers and VMware Cloud on AWS SDDCs with BGP route distribution.',
      role: 'Dedicated Hybrid Transport',
      trafficDirection: 'Bidirectional enterprise traffic',
      highAvailability: 'Dual cross-connects with active/active or active/standby BGP.',
      sizingAndConstraints: 'Supports MTU 8900 Jumbo Frames for accelerated vMotion transfers.',
      portsTable: [
        { protocol: 'BGP', port: '179', source: 'On-Premises Edge', destination: 'AWS DXGW', purpose: 'BGP dynamic route advertisement' }
      ],
      troubleshootingCli: [
        { command: 'aws directconnect describe-virtual-interfaces', context: 'Verify Direct Connect VIF state', expectedOutput: 'virtualInterfaceState: available' }
      ],
      packetFlowSummary: 'Packets traverse physical Direct Connect -> land on Direct Connect Gateway -> routed to VMC SDDC edge.'
    },
    {
      id: 'vmc1-witness',
      name: 'Managed vSAN Witness (AZ-3)',
      category: 'Appliance',
      badge: 'Quorum Guardian',
      xPercent: 50,
      yPercent: 18,
      shortDescription: 'AWS-managed witness micro-appliance deployed in a third availability zone for cluster quorum.',
      fullDescription: 'Maintains split-brain protection and participates in vSAN health elections. If network connectivity between AZ-1 and AZ-2 is severed, the witness establishes cluster ownership without user intervention.',
      role: 'Cluster Quorum & Split-Brain Prevention',
      trafficDirection: 'Low-bandwidth cluster heartbeats and metadata exchanges (< 50 Kbps)',
      highAvailability: 'Hosted in an independent third AWS availability zone.',
      sizingAndConstraints: 'Managed automatically by VMware Cloud on AWS control plane.',
      portsTable: [
        { protocol: 'UDP', port: '1234', source: 'VMC ESXi Hosts', destination: 'Witness Instance', purpose: 'vSAN cluster heartbeat' }
      ],
      troubleshootingCli: [
        { command: 'esxcli vsan cluster get', context: 'Verify witness participation in stretched cluster', expectedOutput: 'Witness Node Found: true, Health: Healthy' }
      ],
      packetFlowSummary: 'Receives keepalive pulses every second; arbitrates cluster leadership during an availability zone outage.'
    },
    {
      id: 'vmc1-az1-nodes',
      name: 'VMC on AWS AZ-1 ESXi Bare-Metal Nodes',
      category: 'Compute & Cluster',
      badge: 'Primary AZ Cluster',
      xPercent: 24,
      yPercent: 46,
      shortDescription: 'Dedicated i3en.metal or i4i.metal bare-metal hypervisors hosted in AWS Availability Zone 1.',
      fullDescription: 'Hosts mission-critical virtual machines with local NVMe storage participating in synchronous cross-AZ write replication. Features hardware acceleration for AWS Elastic Network Adapter (ENA).',
      role: 'Compute & Synchronous Storage Partner',
      trafficDirection: 'Synchronous vSAN write mirroring across inter-AZ links',
      highAvailability: 'vSphere HA automated failover to AZ-2 nodes.',
      sizingAndConstraints: 'Symmetric cluster sizing with matched memory and NVMe capacity.',
      portsTable: [
        { protocol: 'TCP', port: '12321', source: 'AZ-1 ESXi Node', destination: 'AZ-2 ESXi Node', purpose: 'vSAN synchronous replication daemon' }
      ],
      troubleshootingCli: [
        { command: 'esxcli hardware platform get', context: 'Verify host hardware type', expectedOutput: 'Platform Name: i3en.metal' }
      ],
      packetFlowSummary: 'Guest writes are sent simultaneously to AZ-1 and AZ-2 NVMe drives; transaction completes when both acknowledge.'
    },
    {
      id: 'vmc1-az2-nodes',
      name: 'VMC on AWS AZ-2 ESXi Bare-Metal Nodes',
      category: 'Compute & Cluster',
      badge: 'Secondary AZ Cluster',
      xPercent: 76,
      yPercent: 46,
      shortDescription: 'Synchronous secondary ESXi hypervisors hosted in AWS Availability Zone 2.',
      fullDescription: 'Provides immediate zero-RPO failover capacity. If AZ-1 suffers a physical facility failure, vSphere HA automatically re-boots workloads in AZ-2 without data loss.',
      role: 'Zero-RPO Synchronous Standby Cluster',
      trafficDirection: 'Synchronous replication target and live vMotion destination',
      highAvailability: 'Full site survival guarantee across AWS Availability Zones.',
      sizingAndConstraints: 'Symmetric hardware allocation.',
      portsTable: [
        { protocol: 'TCP', port: '8000', source: 'AZ-1 ESXi Node', destination: 'AZ-2 ESXi Node', purpose: 'Cross-AZ vMotion stream' }
      ],
      troubleshootingCli: [
        { command: 'esxcli vsan health cluster list', context: 'Verify stretched cluster health across AZs', expectedOutput: 'All components healthy' }
      ],
      packetFlowSummary: 'Maintains exact real-time block mirrors across AWS fiber paths.'
    }
  ],

  // VMC Design 2: Connected VPC Line-Rate ENI & Amazon FSx for ONTAP
  'vmc-design-2': [
    {
      id: 'vmc2-t0-edge',
      name: 'VMC SDDC NSX-T Tier-0 Edge',
      category: 'Network & Routing',
      badge: 'SDDC Routing Core',
      xPercent: 22,
      yPercent: 40,
      shortDescription: 'Active/Standby or Active/Active NSX-T Tier-0 Edge Gateway routing traffic to AWS services.',
      fullDescription: 'Directly interfaces with AWS VPC Elastic Network Interfaces (ENI) to bridge VMware overlay segments with native AWS subnets at 25 Gbps line rate.',
      role: 'Cross-VPC Gateway',
      trafficDirection: 'East-west traffic to Connected VPC and north-south traffic to DXGW',
      highAvailability: 'Automated stateful failover within the SDDC cluster.',
      sizingAndConstraints: 'Supports 25 Gbps aggregate throughput per ENI link.',
      portsTable: [
        { protocol: 'All', port: 'All', source: 'NSX Overlay VM', destination: 'Connected VPC Subnet', purpose: 'Line-rate routing' }
      ],
      troubleshootingCli: [
        { command: 'get logical-router <t0-id> interfaces', context: 'Verify Connected VPC ENI interface state', expectedOutput: 'Interface: cross-vpc-eni-0, Status: UP' }
      ],
      packetFlowSummary: 'Decapsulates Geneve frames and pushes packets directly out physical ENI into customer AWS VPC.'
    },
    {
      id: 'vmc2-eni',
      name: '25 Gbps Connected VPC Cross-Account ENI',
      category: 'Interconnect',
      badge: 'Zero-Egress Pipe',
      xPercent: 48,
      yPercent: 36,
      shortDescription: 'Dedicated 25 Gbps Elastic Network Interface linking VMC directly into customer AWS VPC with zero egress fees.',
      fullDescription: 'The Connected VPC is the core architectural differentiator of VMware Cloud on AWS. During SDDC provisioning, VMware creates elastic network interfaces (ENIs) inside customer-owned AWS VPC subnets. Traffic between VMC virtual machines and native AWS services (S3, RDS, DynamoDB, Bedrock) traverses this private high-speed link with sub-millisecond latency and $0 data egress fees.',
      role: 'High-Speed Native AWS Interconnect',
      trafficDirection: 'Bidirectional high-speed fabric between VMC SDDC and customer AWS VPC',
      highAvailability: 'Dual ENIs provisioned across availability zones; active ENI failover managed automatically.',
      sizingAndConstraints: 'Up to 25 Gbps per ENI; zero AWS data transfer charge between VMC and Connected VPC in same AZ.',
      portsTable: [
        { protocol: 'TCP', port: '5432', source: 'VMC Application VM', destination: 'Amazon RDS PostgreSQL', purpose: 'Database query stream' }
      ],
      troubleshootingCli: [
        { command: 'aws ec2 describe-network-interfaces --filters "Name=description,Values=*VMware*" --query "NetworkInterfaces[*].Status"', context: 'Check Connected VPC ENI attachment status in AWS CLI', expectedOutput: '["in-use"]' }
      ],
      packetFlowSummary: 'VM sends packet to AWS RDS IP -> NSX Edge routes directly out connected ENI -> packet arrives at customer AWS VPC without touching internet.'
    },
    {
      id: 'vmc2-native-aws',
      name: 'Customer AWS VPC Native Services',
      category: 'Appliance',
      badge: 'Native AWS Cloud',
      xPercent: 76,
      yPercent: 26,
      shortDescription: 'Customer-owned AWS VPC hosting Amazon S3, Aurora, Bedrock, and RDS instances.',
      fullDescription: 'Enables hybrid applications where the presentation and business logic run on VMware virtual machines inside VMC while leveraging native managed AWS cloud services seamlessly.',
      role: 'Cloud Native Application Services',
      trafficDirection: 'Direct private IP connectivity via Connected VPC ENI',
      highAvailability: 'Multi-AZ native AWS infrastructure.',
      sizingAndConstraints: 'Private IP routing without NAT gateways.',
      portsTable: [
        { protocol: 'HTTPS', port: '443', source: 'VMC Guest VM', destination: 'Amazon S3 VPC Endpoint', purpose: 'Object storage API calls' }
      ],
      troubleshootingCli: [
        { command: 'aws ec2 describe-vpcs --vpc-ids <vpc-id>', context: 'Verify customer VPC status in AWS CLI', expectedOutput: 'State: available' }
      ],
      packetFlowSummary: 'Packets traverse local AWS backplane fiber with sub-millisecond response times.'
    },
    {
      id: 'vmc2-fsx',
      name: 'Amazon FSx for NetApp ONTAP Datastore',
      category: 'Storage Fabric',
      badge: 'Decoupled Datastore',
      xPercent: 78,
      yPercent: 64,
      shortDescription: 'Managed NetApp ONTAP external NFS datastores decoupling host compute from storage scaling.',
      fullDescription: 'Amazon FSx for NetApp ONTAP is certified as an external datastore for VMware Cloud on AWS. It allows administrators to attach scalable NFS shares to vSphere clusters, unlocking multi-AZ synchronous replication, inline deduplication, and zero-impact snapshots.',
      role: 'External NFS Datastore Target',
      trafficDirection: 'NFSv3 storage traffic over Connected VPC ENI or Transit Gateway',
      highAvailability: 'Multi-AZ active/standby storage controllers with automated sub-60-second failover.',
      sizingAndConstraints: 'Scales from 1 TB to petabytes with up to 4 GB/s throughput and 160,000 IOPS.',
      portsTable: [
        { protocol: 'TCP', port: '2049', source: 'VMC ESXi vmknic', destination: 'FSx ONTAP Mount IP', purpose: 'NFSv3 block/file I/O' }
      ],
      troubleshootingCli: [
        { command: 'aws fsx describe-file-systems --file-system-ids <fsx-id> --query "FileSystems[0].Lifecycle"', context: 'Verify FSx ONTAP storage system status', expectedOutput: '"AVAILABLE"' }
      ],
      packetFlowSummary: 'ESXi hosts communicate with FSx ONTAP over private ENI fabric -> reads and writes are served from NVMe cache tier and high-capacity tier.'
    }
  ],

  // VMC Design 3: AWS Transit Gateway (TGW) Multi-Account Routing Mesh
  'vmc-design-3': [
    {
      id: 'vmc3-tgw',
      name: 'AWS Transit Gateway (TGW) Regional Hub',
      category: 'Network & Routing',
      badge: 'Regional Transit Core',
      xPercent: 50,
      yPercent: 36,
      shortDescription: 'Central cloud router connecting thousands of VPCs, VMC SDDCs, and on-premises circuits.',
      fullDescription: 'AWS Transit Gateway simplifies network topology by acting as a centralized hub. Connects multiple VMC SDDCs, shared services VPCs, and Direct Connect Gateways using hub-and-spoke routing with route table segmentation.',
      role: 'Multi-VPC Transit Hub',
      trafficDirection: 'Hub-and-spoke inter-VPC and hybrid traffic routing',
      highAvailability: 'Fully managed regional AWS service scaling elastically up to 50 Gbps per attachment.',
      sizingAndConstraints: 'Supports up to 5,000 VPC attachments per transit gateway.',
      portsTable: [
        { protocol: 'All', port: 'All', source: 'VMC Attachment', destination: 'Transit Gateway', purpose: 'Inter-account packet forwarding' }
      ],
      troubleshootingCli: [
        { command: 'aws ec2 describe-transit-gateways --transit-gateway-ids <tgw-id>', context: 'Verify TGW operational status', expectedOutput: 'State: available' }
      ],
      packetFlowSummary: 'Packets from VMC SDDC enter Transit Gateway attachment -> routed based on TGW route table rules directly to destination VPC.'
    },
    {
      id: 'vmc3-vmc-attachment',
      name: 'VMC SDDC Transit Gateway Attachment',
      category: 'Interconnect',
      badge: 'SDDC Peering Link',
      xPercent: 22,
      yPercent: 42,
      shortDescription: 'Direct peering attachment connecting VMC NSX-T Tier-0 router into AWS Transit Gateway.',
      fullDescription: 'Provides scalable multi-gigabit throughput from VMware SDDC to hundreds of customer AWS VPCs without requiring complex mesh peering configurations.',
      role: 'SDDC Transport Attachment',
      trafficDirection: 'Outbound traffic to multi-account enterprise AWS VPCs',
      highAvailability: 'Managed attachment with multi-AZ resilience.',
      sizingAndConstraints: 'Supports static and dynamic BGP route exchanges.',
      portsTable: [
        { protocol: 'IP / BGP', port: '179', source: 'VMC Tier-0', destination: 'TGW Router', purpose: 'Prefix advertisement' }
      ],
      troubleshootingCli: [
        { command: 'aws ec2 describe-transit-gateway-attachments', context: 'List active TGW attachments', expectedOutput: 'State: available, ResourceType: vpc' }
      ],
      packetFlowSummary: 'Injects SDDC workload subnets directly into enterprise transit routing table.'
    },
    {
      id: 'vmc3-multi-vpc',
      name: 'Enterprise Multi-VPC Attachments',
      category: 'Network & Routing',
      badge: 'Multi-Account Spoke',
      xPercent: 78,
      yPercent: 24,
      shortDescription: 'Production, staging, and shared services VPCs connected into Transit Gateway.',
      fullDescription: 'Decoupled AWS accounts and environments separated by security boundaries while maintaining routed access to shared VMware application stacks.',
      role: 'Enterprise Application Spokes',
      trafficDirection: 'Inter-VPC enterprise communications',
      highAvailability: 'Multi-AZ VPC subnets.',
      sizingAndConstraints: 'Isolated route tables preventing unauthorized cross-talk.',
      portsTable: [
        { protocol: 'TCP', port: '443 / 8443', source: 'Spoke VPC App', destination: 'VMC Database', purpose: 'Internal API communication' }
      ],
      troubleshootingCli: [
        { command: 'aws ec2 describe-transit-gateway-route-tables', context: 'Verify TGW route table propagation', expectedOutput: 'State: available' }
      ],
      packetFlowSummary: 'Spoke VPC route tables direct RFC1918 traffic to TGW -> TGW forwards directly into VMC SDDC.'
    },
    {
      id: 'vmc3-dxgw',
      name: 'Direct Connect Gateway (DXGW) Hybrid Uplink',
      category: 'Interconnect',
      badge: 'Hybrid Underlay',
      xPercent: 24,
      yPercent: 72,
      shortDescription: 'AWS Direct Connect Gateway linking physical enterprise data centers to Transit Gateway.',
      fullDescription: 'Terminates hybrid carrier circuits and propagates on-premises prefixes into the Transit Gateway, enabling uniform on-prem access to both VMC and native AWS workloads.',
      role: 'Carrier Hybrid Uplink',
      trafficDirection: 'On-premises to cloud hybrid traffic',
      highAvailability: 'Redundant Direct Connect circuits across independent locations.',
      sizingAndConstraints: 'Supports Transit Virtual Interfaces (Transit VIFs).',
      portsTable: [
        { protocol: 'BGP', port: '179', source: 'On-Premises Edge', destination: 'DXGW Router IP', purpose: 'BGP prefix advertisement' }
      ],
      troubleshootingCli: [
        { command: 'aws directconnect describe-direct-connect-gateway-attachments', context: 'Verify DXGW to TGW attachment', expectedOutput: 'attachmentState: attached' }
      ],
      packetFlowSummary: 'On-prem traffic reaches DXGW -> transmitted over AWS backbone to TGW -> routed to VMC SDDC.'
    }
  ],

  // ==========================================
  // 4. NSX-T ENTERPRISE MICROSEGMENTATION
  // ==========================================

  // NSX Design 1: Distributed Firewall (DFW) Zero-Trust Microsegmentation
  'nsx-design-1': [
    {
      id: 'nsx1-dfw-kernel',
      name: 'ESXi Kernel Distributed Firewall (DFW)',
      category: 'Security & Firewall',
      badge: 'vNIC Kernel Filter',
      xPercent: 24,
      yPercent: 38,
      shortDescription: 'Stateful Layer 4-7 firewall engine running natively inside hypervisor kernel at every VM vNIC.',
      fullDescription: 'Inspects every packet at the virtual network adapter before the packet touches the virtual switch. Because inspection occurs at the hypervisor kernel, east-west attacks cannot spread to neighboring VMs on the same broadcast domain.',
      role: 'Zero-Trust Kernel Packet Inspection Engine',
      trafficDirection: 'Stateful east-west inspection on ingress and egress of every virtual machine',
      highAvailability: 'Fully distributed across all ESXi hosts with zero single point of failure.',
      sizingAndConstraints: 'Line-rate throughput without hair-pinning traffic to physical appliances; scales linearly with hosts.',
      portsTable: [
        { protocol: 'All', port: 'All', source: 'Guest VM vNIC', destination: 'Hypervisor vSwitch', purpose: 'Stateful packet inspection before switching' }
      ],
      troubleshootingCli: [
        { command: 'summarize-dvfilter', context: 'Inspect active DFW filter rules applied to VM vNICs on host CLI', expectedOutput: 'Filter name: nic-10293-eth0-vmware-sfw.2, State: Enabled' }
      ],
      packetFlowSummary: 'Packet is generated by guest OS -> hits dvFilter in ESXi kernel -> DFW rule evaluated in microseconds -> allowed or dropped before reaching switch port.'
    },
    {
      id: 'nsx1-web-tier',
      name: 'Web Tier Security Group',
      category: 'Security & Firewall',
      badge: 'Public DMZ Group',
      xPercent: 48,
      yPercent: 24,
      shortDescription: 'Dynamic NSX security group containing public-facing web servers.',
      fullDescription: 'Security policy strictly permits HTTPS (TCP 443) from load balancers and restricts outbound connections exclusively to the App Tier on application-specific ports.',
      role: 'Front-End Ingress Boundary',
      trafficDirection: 'Permits inbound HTTPS from ALB; outbound TCP 8080/8443 to App Tier',
      highAvailability: 'Dynamic tag-based membership automatically protects new VMs upon deployment.',
      sizingAndConstraints: 'Tags applied via vCenter or automation tools like Terraform.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'Internet / ALB VIP', destination: 'Web Tier VMs', purpose: 'Client HTTPS web traffic' },
        { protocol: 'TCP', port: '8443', source: 'Web Tier VMs', destination: 'App Tier VIP', purpose: 'Backend application API calls' }
      ],
      troubleshootingCli: [
        { command: 'get security-group <web-sg-id> members', context: 'Verify dynamic VM membership in NSX Edge CLI', expectedOutput: 'Total Members: 6 VMs [Tag: web-frontend]' }
      ],
      packetFlowSummary: 'Inbound requests pass through strict DFW rules -> Web VM processes request -> calls App tier on permitted port only.'
    },
    {
      id: 'nsx1-app-tier',
      name: 'App Tier Security Group',
      category: 'Security & Firewall',
      badge: 'Middle Tier Mesh',
      xPercent: 50,
      yPercent: 52,
      shortDescription: 'Isolated application tier security perimeter enforcing strict zero-trust communication.',
      fullDescription: 'Rejects all direct incoming traffic except from validated Web Tier VMs on explicit microservice ports, preventing lateral movement if web servers are compromised.',
      role: 'Application Business Logic Isolation',
      trafficDirection: 'Inbound from Web Tier; Outbound to Database Tier only',
      highAvailability: 'Dynamic scale-out security group.',
      sizingAndConstraints: 'Zero east-west communication allowed between peers in the same tier unless explicitly permitted.',
      portsTable: [
        { protocol: 'TCP', port: '8443', source: 'Web Tier', destination: 'App Tier', purpose: 'Application business logic API' },
        { protocol: 'TCP', port: '5432', source: 'App Tier', destination: 'DB Tier', purpose: 'Database queries' }
      ],
      troubleshootingCli: [
        { command: 'get firewall status', context: 'Verify DFW rule status on ESXi host', expectedOutput: 'Firewall is active and rules are loaded' }
      ],
      packetFlowSummary: 'App tier accepts authorized API calls -> executes queries against DB tier -> sends responses back to web tier.'
    },
    {
      id: 'nsx1-db-tier',
      name: 'Database Tier Isolation Group',
      category: 'Security & Firewall',
      badge: 'Restricted Vault',
      xPercent: 52,
      yPercent: 78,
      shortDescription: 'Highest security isolation group locking down transactional database instances.',
      fullDescription: 'Completely blocked from the internet and web tiers. Only accepts connections on strict database listener ports (e.g. TCP 5432, 1433, 1521) originating strictly from App Tier security group members.',
      role: 'Core Data Security Perimeter',
      trafficDirection: 'Inbound DB ports from App Tier only; Outbound completely denied except for backup targets',
      highAvailability: 'Always-On database cluster support.',
      sizingAndConstraints: 'Strict default-deny rule at bottom of policy table.',
      portsTable: [
        { protocol: 'TCP', port: '5432', source: 'App Tier VMs', destination: 'Database VMs', purpose: 'Encrypted PostgreSQL queries' }
      ],
      troubleshootingCli: [
        { command: 'nsxcli -c get firewall table ruleset | grep -i "db-tier"', context: 'Check DB firewall ruleset on host', expectedOutput: 'Action: ALLOW (From: App-Tier), Action: DROP (From: Any)' }
      ],
      packetFlowSummary: 'Any packet not originating from an authorized App VM is instantly dropped and logged at the hypervisor kernel.'
    },
    {
      id: 'nsx1-policy-manager',
      name: 'NSX Policy Manager Cluster',
      category: 'Appliance',
      badge: 'Central Security Plane',
      xPercent: 78,
      yPercent: 36,
      shortDescription: 'Tri-node clustered management appliance defining declarative zero-trust security policies.',
      fullDescription: 'Centrally pushes declarative microsegmentation rules and security tags to every hypervisor in the datacenter, maintaining synchronized state and compliance logging.',
      role: 'Centralized Security Control Plane',
      trafficDirection: 'Management plane TLS communications to ESXi host agents',
      highAvailability: 'Tri-node clustered management appliances with automated leader election.',
      sizingAndConstraints: 'Requires 3 virtual appliances for production HA.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'Security Admin / CI/CD', destination: 'NSX Policy Manager VIP', purpose: 'REST API & Policy definitions' }
      ],
      troubleshootingCli: [
        { command: 'get cluster status', context: 'Check NSX Manager cluster health', expectedOutput: 'Cluster status: STABLE, Leader: node-1' }
      ],
      packetFlowSummary: 'Admin submits policy via API -> Policy Manager translates to runtime rules -> pushes to ESXi kernels in seconds.'
    }
  ],

  // NSX Design 2: Tier-0 / Tier-1 ECMP Gateway High-Availability Fabric
  'nsx-design-2': [
    {
      id: 'nsx2-t0-cluster',
      name: 'Active/Active Tier-0 Gateway Cluster',
      category: 'Network & Routing',
      badge: 'ECMP Routing Core',
      xPercent: 50,
      yPercent: 22,
      shortDescription: 'Active/Active multi-node edge cluster providing line-rate north-south Equal-Cost Multi-Path (ECMP) routing.',
      fullDescription: 'Terminates dynamic eBGP peering with physical spine-leaf switches and hyperscaler interconnects. Delivers up to 8-way ECMP forwarding across edge nodes with sub-second BFD failover.',
      role: 'North-South Enterprise Routing Core',
      trafficDirection: 'High-bandwidth north-south traffic entering/leaving the overlay fabric',
      highAvailability: 'Active/Active multi-node ECMP with Bidirectional Forwarding Detection (BFD).',
      sizingAndConstraints: 'Scales up to 8 Edge Nodes in a single cluster delivering 80+ Gbps throughput.',
      portsTable: [
        { protocol: 'BGP', port: '179', source: 'Tier-0 Edge Node', destination: 'Physical Leaf Switch', purpose: 'BGP routing sessions' },
        { protocol: 'BFD', port: '3784', source: 'Tier-0 Edge Node', destination: 'Physical Leaf Switch', purpose: 'Sub-second link failure detection' }
      ],
      troubleshootingCli: [
        { command: 'get logical-router <t0-id> bgp neighbor summary', context: 'Verify Tier-0 BGP peering state in Edge CLI', expectedOutput: 'State: Established, BFD Status: Admin Up' }
      ],
      packetFlowSummary: 'Ingress traffic is load-balanced across all Edge nodes using ECMP hashing -> forwarded over Geneve tunnels to destination hosts.'
    },
    {
      id: 'nsx2-t1-gateways',
      name: 'Multi-Tenant Tier-1 Gateways',
      category: 'Network & Routing',
      badge: 'Tenant Router',
      xPercent: 50,
      yPercent: 48,
      shortDescription: 'Distributed tenant routers providing local routing and stateful edge services for application tiers.',
      fullDescription: 'Decouples tenant routing from enterprise core routing. Features Distributed Routers (DR) running on every hypervisor for zero-hop east-west routing, paired with Service Routers (SR) on Edge nodes for NAT and VPN.',
      role: 'Tenant & Department Routing Boundary',
      trafficDirection: 'East-west routing between tenant segments and north-south handoff to Tier-0',
      highAvailability: 'Distributed across all hypervisors with active/standby Service Routers.',
      sizingAndConstraints: 'Can host hundreds of Tier-1 routers attached to a single Tier-0 gateway.',
      portsTable: [
        { protocol: 'Internal Router Link', port: 'N/A', source: 'Tier-1 Gateway', destination: 'Tier-0 Gateway', purpose: 'Automated prefix route distribution' }
      ],
      troubleshootingCli: [
        { command: 'get logical-router <t1-id> route', context: 'Check active routes on Tier-1 router', expectedOutput: 'Default route 0.0.0.0/0 via Tier-0 Router-Link' }
      ],
      packetFlowSummary: 'VMs on different segments of same tenant route locally at host hypervisor without hitting Edge nodes.'
    },
    {
      id: 'nsx2-underlay-switches',
      name: 'Physical Spine-Leaf Underlay Switches',
      category: 'Interconnect',
      badge: 'Physical Fabric',
      xPercent: 20,
      yPercent: 20,
      shortDescription: 'Physical Top-of-Rack (ToR) and spine switches configured with MTU 9000 Jumbo Frames.',
      fullDescription: 'Underlay network providing high-speed IP transport for encapsulated Geneve packets between hypervisors and NSX Edge nodes with BGP route reflection.',
      role: 'Physical IP Transport Underlay',
      trafficDirection: 'IP transport between physical host interfaces (vmnics)',
      highAvailability: 'Redundant dual-homed ToR switches with multi-chassis link aggregation (MLAG).',
      sizingAndConstraints: 'Requires MTU of at least 1600 bytes (recommended 9000 bytes) to accommodate Geneve header overhead.',
      portsTable: [
        { protocol: 'IP / BGP', port: '179', source: 'Leaf Switch', destination: 'Spine Switch', purpose: 'Underlay routing' }
      ],
      troubleshootingCli: [
        { command: 'show ip bgp summary', context: 'Verify BGP on physical switch CLI', expectedOutput: 'BGP state: Established' }
      ],
      packetFlowSummary: 'Switches route outer IP headers of encapsulated Geneve packets with wire-rate speed.'
    },
    {
      id: 'nsx2-geneve-segments',
      name: 'Overlay Geneve Transport Segments',
      category: 'Network & Routing',
      badge: 'Overlay Segments',
      xPercent: 50,
      yPercent: 76,
      shortDescription: 'Virtual Layer 2 broadcast domains encapsulated over physical underlay using Geneve protocol.',
      fullDescription: 'Virtual machines connect to Geneve overlay segments, decoupling virtual network topologies completely from physical VLAN allocations and switch hardware.',
      role: 'Virtual Machine Network Connectivity',
      trafficDirection: 'Encapsulated VM payload packets',
      highAvailability: 'Distributed across all hypervisors in the transport zone.',
      sizingAndConstraints: 'Up to 16 million unique virtual network segments (VNIs).',
      portsTable: [
        { protocol: 'Geneve', port: '6081', source: 'Source Host TEP', destination: 'Destination Host TEP', purpose: 'Overlay packet encapsulation' }
      ],
      troubleshootingCli: [
        { command: 'esxcli network ip connection list | grep 6081', context: 'Check active Geneve TEP connections on ESXi', expectedOutput: 'UDP 0.0.0.0:6081 *:*' }
      ],
      packetFlowSummary: 'Guest frame is encapsulated with Geneve header (UDP 6081) -> routed over underlay -> decapsulated at destination host.'
    }
  ],

  // NSX Design 3: Avi Vantage NSX ALB Load Balancer
  'nsx-design-3': [
    {
      id: 'nsx3-controller',
      name: 'Avi Controller Cluster',
      category: 'Appliance',
      badge: 'Central ADC Plane',
      xPercent: 50,
      yPercent: 18,
      shortDescription: 'Central control and management plane cluster orchestrating elastic application delivery.',
      fullDescription: 'Monitors application performance, analyzes real-time telemetry, automatically spins up or down Service Engine data plane instances, and enforces WAF security policies.',
      role: 'Application Delivery Controller Management',
      trafficDirection: 'Control plane REST APIs and telemetry ingestion from Service Engines',
      highAvailability: '3-node controller cluster providing automated quorum failover.',
      sizingAndConstraints: 'Manages hundreds of Service Engines across multi-cloud environments.',
      portsTable: [
        { protocol: 'HTTPS', port: '443', source: 'Admin / API', destination: 'Avi Controller Cluster', purpose: 'Management and policy push' },
        { protocol: 'SSH / TLS', port: '8443', source: 'Avi Controller', destination: 'Service Engines', purpose: 'Control plane telemetry' }
      ],
      troubleshootingCli: [
        { command: 'show cluster status', context: 'Verify Avi Controller cluster health', expectedOutput: 'Cluster status: CLUSTER_UP' }
      ],
      packetFlowSummary: 'Calculates latency metrics and scales Service Engine capacity dynamically when traffic spikes occur.'
    },
    {
      id: 'nsx3-virtual-service',
      name: 'Virtual Service VIP (SSL & WAF)',
      category: 'Network & Routing',
      badge: 'Virtual VIP',
      xPercent: 22,
      yPercent: 46,
      shortDescription: 'High-availability Virtual IP terminating client SSL/TLS sessions and executing WAF inspection.',
      fullDescription: 'Terminates client HTTPS connections, executes hardware-accelerated TLS certificate validation, inspects payloads against OWASP Top 10 rules, and applies rate-limiting policies.',
      role: 'Client Ingress & Security Inspection',
      trafficDirection: 'Inbound client internet / intranet connections',
      highAvailability: 'BGP Anycast or Native ECMP distributing VIP across multiple Service Engines.',
      sizingAndConstraints: 'High concurrent SSL transaction handling with zero dropped connections.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'Client Browser', destination: 'Avi Virtual Service VIP', purpose: 'HTTPS application traffic' }
      ],
      troubleshootingCli: [
        { command: 'show virtualservice <vs-name>', context: 'Check Virtual Service health and metrics in Avi CLI', expectedOutput: 'Status: OPER_UP, Conns/sec: 1240' }
      ],
      packetFlowSummary: 'Client initiates TLS handshake -> VIP terminates connection -> evaluates WAF rules -> selects backend server.'
    },
    {
      id: 'nsx3-service-engines',
      name: 'Avi Vantage Service Engines (SE)',
      category: 'Appliance',
      badge: 'Software ADC Plane',
      xPercent: 48,
      yPercent: 46,
      shortDescription: 'Elastic software load balancing data plane instances distributing application traffic.',
      fullDescription: 'Lightweight virtual machine instances running in ESXi or cloud SDDCs that handle actual packet switching, SSL offloading, caching, compression, and server health checks.',
      role: 'Elastic L4-L7 Data Plane Processing',
      trafficDirection: 'Proxies client requests to backend server pools',
      highAvailability: 'Active/Active or Active/Standby Service Engine pairs with automatic self-healing.',
      sizingAndConstraints: 'Scales from 1 to 100+ Gbps throughput dynamically.',
      portsTable: [
        { protocol: 'TCP', port: '8080 / 8443', source: 'Service Engine', destination: 'Backend Pool VM', purpose: 'Reverse proxy HTTP request' }
      ],
      troubleshootingCli: [
        { command: 'show serviceengine detail', context: 'Inspect Service Engine health', expectedOutput: 'Status: OPER_UP, CPU Usage: 18%' }
      ],
      packetFlowSummary: 'Terminates client connection -> opens backend TCP socket -> forwards clean request to healthiest server.'
    },
    {
      id: 'nsx3-backend-pool',
      name: 'Backend Application VM Pool',
      category: 'Compute & Cluster',
      badge: 'Target Servers',
      xPercent: 78,
      yPercent: 46,
      shortDescription: 'Pool of web and application virtual machines receiving balanced workloads.',
      fullDescription: 'Receives optimized, decrypted HTTP requests from Service Engines. Monitored continuously via synthetic HTTP health checks with automated draining of degraded instances.',
      role: 'Application Workload Execution',
      trafficDirection: 'Receives reverse-proxied traffic from Service Engines',
      highAvailability: 'Dynamic scaling pool with automated instance health isolation.',
      sizingAndConstraints: 'Supports round-robin, least-connections, and consistent-hash algorithms.',
      portsTable: [
        { protocol: 'TCP', port: '8080', source: 'Service Engine VIP', destination: 'App Server IP', purpose: 'Application processing' }
      ],
      troubleshootingCli: [
        { command: 'show pool <pool-name> serverdetail', context: 'Verify server pool status', expectedOutput: 'All servers UP, Response Time: 4ms' }
      ],
      packetFlowSummary: 'Server processes application request -> returns response to Service Engine -> Service Engine encrypts and returns to client.'
    }
  ],

  // ==========================================
  // 5. VMWARE HCX HYPERSCALER MIGRATION FABRIC
  // ==========================================

  // HCX Design 1: HCX Multi-Site Interconnect & Service Mesh
  'hcx-design-1': [
    {
      id: 'hcx1-manager-prem',
      name: 'HCX Connector (On-Premises)',
      category: 'Appliance',
      badge: 'Source Orchestrator',
      xPercent: 18,
      yPercent: 26,
      shortDescription: 'On-premises management virtual appliance coordinating migrations from vCenter.',
      fullDescription: 'HCX Connector deploys in the source data center, registering with local vCenter and SSO. Manages site pairing, Compute Profiles, Network Profiles, and Service Mesh appliances.',
      role: 'On-Premises Migration Coordinator',
      trafficDirection: 'Outbound HTTPS (TCP 443) to HCX Cloud Manager; Inbound from local vSphere Web Client',
      highAvailability: 'vSphere HA with automated restart.',
      sizingAndConstraints: '4 vCPU, 12 GB RAM, 60 GB Storage.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'HCX Connector', destination: 'HCX Cloud Manager', purpose: 'Site pairing & Service Mesh sync' },
        { protocol: 'TCP', port: '902', source: 'HCX Connector', destination: 'ESXi Hosts', purpose: 'Host NFC and vSphere handshakes' }
      ],
      troubleshootingCli: [
        { command: 'systemctl status app-engine', context: 'Check HCX application daemon health on appliance', expectedOutput: 'active (running)' }
      ],
      packetFlowSummary: 'Coordinates migration waves and instructs local IX/NE appliances to open encrypted tunnels to target cloud.'
    },
    {
      id: 'hcx1-ix',
      name: 'HCX Interconnect (IX) Appliance',
      category: 'Appliance',
      badge: 'Data Plane Engine',
      xPercent: 36,
      yPercent: 52,
      shortDescription: 'High-throughput data transport appliance managing VM disk replication and live vMotion.',
      fullDescription: 'The HCX Interconnect (IX) appliance terminates a secure IPsec tunnel (UDP 4500) over the hybrid underlay. Reads VM disk blocks via CBT/NFC, compresses and encrypts them, and writes the bytes into target datastores.',
      role: 'Encrypted Data Transport & vMotion Proxy',
      trafficDirection: 'UDP 4500 bidirectional between on-prem and cloud IX; TCP 902 from source ESXi hosts',
      highAvailability: 'Can be deployed in Active/Standby configuration or scaled across multiple compute clusters.',
      sizingAndConstraints: '8 vCPU, 3 GB RAM per appliance; supports up to 8 concurrent RAV or 200 Bulk migrations simultaneously.',
      portsTable: [
        { protocol: 'UDP', port: '4500', source: 'Source IX Appliance', destination: 'Target IX Appliance', purpose: 'IPsec ESP encapsulated migration transport' }
      ],
      troubleshootingCli: [
        { command: 'hcx-cli> ipsec status', context: 'IX console tunnel verification', expectedOutput: 'Tunnel [IX-Uplink-01]: UP, Encapsulation: ESP-AES-GCM-256' }
      ],
      packetFlowSummary: 'Reads blocks from source VM via CBT/NFC (TCP 902) -> packages into encrypted IPsec frames -> transmits over UDP 4500 -> cloud IX writes to target datastore.'
    },
    {
      id: 'hcx1-ne',
      name: 'HCX Network Extension (NE) Appliance',
      category: 'Appliance',
      badge: 'L2 Subnet Bridge',
      xPercent: 56,
      yPercent: 52,
      shortDescription: 'Low-latency bridge extending on-premises VLAN subnets into Cloud NSX-T overlays.',
      fullDescription: 'Bridges on-premises Layer 2 broadcast domains (VLANs) into the cloud SDDC NSX-T overlay segments without requiring IP re-addressing, subnet restructuring, or DNS adjustments.',
      role: 'Layer 2 Broadcast Domain Extension',
      trafficDirection: 'Bidirectional UDP 4500 IPsec tunnel carrying encapsulated L2 Ethernet frames',
      highAvailability: 'High Availability (Active/Standby) appliance pairs supported with sub-second failover via BFD.',
      sizingAndConstraints: '4 vCPU, 4 GB RAM per appliance; extends up to 8 VLANs per appliance pair with 10 Gbps aggregate throughput.',
      portsTable: [
        { protocol: 'UDP', port: '4500', source: 'Source NE Appliance', destination: 'Cloud NE Appliance', purpose: 'L2 Geneve/IPsec encapsulated traffic bridge' }
      ],
      troubleshootingCli: [
        { command: 'show interface vlan-bridge', context: 'Inspect extended VLAN operational state in NE appliance shell', expectedOutput: 'VLAN 102 -> Bridge br-102: Status UP' }
      ],
      packetFlowSummary: 'Source VM packet -> Source NE encapsulates in UDP 4500 -> Transmitted across Underlay -> Target NE de-encapsulates -> Lands on Cloud NSX Segment.'
    },
    {
      id: 'hcx1-manager-cloud',
      name: 'HCX Cloud Manager',
      category: 'Appliance',
      badge: 'Target Orchestrator',
      xPercent: 80,
      yPercent: 26,
      shortDescription: 'Target cloud control plane appliance managing cloud fleet and NSX network extension mapping.',
      fullDescription: 'Registers with target cloud vCenter and NSX Manager. Coordinates migration scheduling, storage allocation, and target network extension attachments.',
      role: 'Cloud Control Plane & API Endpoint',
      trafficDirection: 'Inbound TLS from On-Premises HCX Connector; Outbound HTTPS to Cloud vCenter & NSX APIs',
      highAvailability: 'Protected by vSphere HA within the Cloud SDDC.',
      sizingAndConstraints: '4 vCPU, 12 GB RAM, 60 GB Storage.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'HCX Connector (On-Prem)', destination: 'HCX Cloud Manager', purpose: 'Management site pairing & migration orchestration' }
      ],
      troubleshootingCli: [
        { command: 'curl -kv https://<hcx-cloud-ip>:443/hybridity/api/admin/status', context: 'Test site pairing reachability', expectedOutput: 'HTTP/1.1 200 OK' }
      ],
      packetFlowSummary: 'Receives migration commands -> orchestrates local cloud storage reservation -> updates NSX segment inventory.'
    },
    {
      id: 'hcx1-wo',
      name: 'WAN Optimization (HCX-WO) Engine',
      category: 'Appliance',
      badge: 'Inline Compression',
      xPercent: 46,
      yPercent: 74,
      shortDescription: 'Inline deduplication and LZ-compression engine accelerating migration over constrained circuits.',
      fullDescription: 'Caches redundant data patterns and compresses replication traffic before transmission across WAN/DirectConnect links, reducing total bandwidth consumption by up to 50-70%.',
      role: 'Migration Bandwidth Acceleration',
      trafficDirection: 'Inline compression pipeline for HCX-IX data streams',
      highAvailability: 'Integrated into HCX Service Mesh architecture.',
      sizingAndConstraints: 'Requires dedicated RAM and disk cache for deduplication database.',
      portsTable: [
        { protocol: 'Internal Socket', port: 'N/A', source: 'HCX-IX', destination: 'HCX-WO', purpose: 'Byte-stream deduplication' }
      ],
      troubleshootingCli: [
        { command: 'hcx-cli> wo stats', context: 'Check compression efficiency in HCX CLI', expectedOutput: 'Compression Ratio: 2.8:1, Bandwidth Saved: 64%' }
      ],
      packetFlowSummary: 'Duplicate blocks are replaced with small hash pointers -> transmitted across WAN -> reassembled by target WO.'
    }
  ],

  // HCX Design 2: Mobility Optimized Networking (MON) Anti-Hairpin Routing
  'hcx-design-2': [
    {
      id: 'hcx2-onprem-gw',
      name: 'On-Premises Legacy Default Gateway',
      category: 'Network & Routing',
      badge: 'Legacy Core GW',
      xPercent: 20,
      yPercent: 42,
      shortDescription: 'Physical datacenter gateway servicing non-migrated enterprise virtual machines.',
      fullDescription: 'Without MON enabled, all traffic from migrated cloud VMs must hairpin back across the WAN to this gateway before accessing internet or local services. MON resolves this bottleneck.',
      role: 'On-Premises Subnet Gateway',
      trafficDirection: 'Traditional default gateway for enterprise datacenter VLANs',
      highAvailability: 'Physical VRRP/HSRP core router pairs.',
      sizingAndConstraints: 'Becomes a severe latency and throughput bottleneck if traffic hairpins back from cloud.',
      portsTable: [
        { protocol: 'IP', port: 'Any', source: 'On-Prem VM', destination: 'Default Gateway VIP', purpose: 'Default gateway routing' }
      ],
      troubleshootingCli: [
        { command: 'traceroute 8.8.8.8', context: 'Trace route from on-prem host', expectedOutput: '1  192.168.10.1 (On-Prem GW)  0.4 ms' }
      ],
      packetFlowSummary: 'Answers ARP for on-premises virtual machines that have not yet migrated to the cloud.'
    },
    {
      id: 'hcx2-stretched-l2',
      name: 'Stretched Layer 2 Subnet Domain',
      category: 'Interconnect',
      badge: 'L2 Bridge Mesh',
      xPercent: 50,
      yPercent: 68,
      shortDescription: 'Extended broadcast domain spanning between on-premises VLAN and cloud NSX segment.',
      fullDescription: 'Allows virtual machines on the same subnet (e.g. 192.168.10.0/24) to reside simultaneously in on-premises and cloud datacenters with full Layer 2 reachability during phased migration waves.',
      role: 'Hybrid Broadcast Domain',
      trafficDirection: 'Bridged Layer 2 Ethernet frames over UDP 4500 IPsec tunnel',
      highAvailability: 'Active/Standby NE appliance pair with BFD failover.',
      sizingAndConstraints: 'MTU preserved; handles ARP and broadcast frames with rate limiting.',
      portsTable: [
        { protocol: 'UDP', port: '4500', source: 'On-Prem NE', destination: 'Cloud NE', purpose: 'Layer 2 encapsulated tunnel' }
      ],
      troubleshootingCli: [
        { command: 'show interface vlan-bridge', context: 'Check extended network state', expectedOutput: 'Bridge: br-10.0, State: UP' }
      ],
      packetFlowSummary: 'Ethernet frames from non-MON traffic traverse the L2 extension tunnel transparently.'
    },
    {
      id: 'hcx2-migrated-vms',
      name: 'Cloud-Resident Migrated VMs',
      category: 'Compute & Cluster',
      badge: 'Cloud Workloads',
      xPercent: 74,
      yPercent: 28,
      shortDescription: 'Virtual machines already migrated into cloud SDDC retaining original on-premises IP addresses.',
      fullDescription: 'Because MON is enabled on their vNICs, these VMs route locally through cloud gateways for cloud-to-cloud and cloud-to-internet traffic, bypassing the on-premises WAN circuit entirely.',
      role: 'Migrated Production Workloads',
      trafficDirection: 'Direct local cloud egress and high-speed cloud-to-cloud communications',
      highAvailability: 'Protected by vSphere HA and DRS in cloud SDDC.',
      sizingAndConstraints: 'Retains original IP, MAC, and gateway configuration without changes.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'Migrated VM', destination: 'Native Cloud PaaS', purpose: 'Direct low-latency cloud access' }
      ],
      troubleshootingCli: [
        { command: 'traceroute 10.100.1.5', context: 'Trace route from migrated cloud VM to native cloud VPC', expectedOutput: '1  192.168.10.1 (NSX MON T1)  0.3 ms  2  10.100.1.5  0.8 ms' }
      ],
      packetFlowSummary: 'VM sends packet to local default gateway -> Cloud NSX Tier-1 answers ARP directly -> forwards to cloud native destination in < 1ms.'
    },
    {
      id: 'hcx2-mon-router',
      name: 'Mobility Optimized Networking (MON) Router',
      category: 'Network & Routing',
      badge: 'Anti-Hairpin Engine',
      xPercent: 66,
      yPercent: 44,
      shortDescription: 'Intelligent routing router extension that avoids tromboning/hairpinning for migrated cloud VMs.',
      fullDescription: 'When a VM moves to the cloud on an extended L2 subnet, MON injects host routes (/32) into the Cloud NSX Tier-1 router, allowing the cloud VM to route locally to other cloud VMs, native cloud services, and the internet without sending packets back to on-prem.',
      role: 'Local Cloud Default Gateway & Host Routing',
      trafficDirection: 'Local North-South breakout via Cloud NSX-T Tier-1 / Tier-0 Gateway',
      highAvailability: 'Integrated directly into NSX-T Edge cluster active routing tables.',
      sizingAndConstraints: 'Requires VMware HCX Enterprise license; max 500 MON-enabled VMs per extended network.',
      portsTable: [
        { protocol: 'IP / BGP', port: '179', source: 'NSX Tier-1 Router', destination: 'NSX Tier-0 Router', purpose: 'Host route (/32) redistribution to enterprise core' }
      ],
      troubleshootingCli: [
        { command: 'get logical-router <t1-uuid> forwarding', context: 'Verify /32 host route injection in NSX Edge CLI', expectedOutput: '192.168.10.45/32 via 100.64.1.2 [Type: MON-Host-Route]' }
      ],
      packetFlowSummary: 'Migrated VM sends outbound packet -> NSX Tier-1 intercepts packet locally -> routes directly out Tier-0 to Cloud Gateway -> zero WAN round-trips.'
    }
  ],

  // HCX Design 3: Replication-Assisted vMotion (RAV) Live Migration
  'hcx-design-3': [
    {
      id: 'hcx3-source-vms',
      name: 'Source On-Premises Production VMs',
      category: 'Compute & Cluster',
      badge: 'Active Workloads',
      xPercent: 20,
      yPercent: 40,
      shortDescription: 'Production virtual machines continuing to process live database transactions during migration.',
      fullDescription: 'Workloads continue servicing client transactions without slowdown. Changed Block Tracking (CBT) intercepts disk writes in the hypervisor while background seed replication transfers data to cloud.',
      role: 'Production Source Workloads',
      trafficDirection: 'Normal application traffic + CBT snapshot replication stream',
      highAvailability: 'Protected by on-prem vSphere HA until migration cutover.',
      sizingAndConstraints: 'Compatible with virtual hardware version 7 and above.',
      portsTable: [
        { protocol: 'TCP', port: '902', source: 'Source ESXi Host', destination: 'HCX-IX Appliance', purpose: 'NFC disk block reading' }
      ],
      troubleshootingCli: [
        { command: 'vim-cmd vmsvc/get.summary <vmid>', context: 'Check source VM state on ESXi CLI', expectedOutput: 'powerState: poweredOn' }
      ],
      packetFlowSummary: 'Guest writes blocks to local SAN -> CBT filter logs changed block offsets for incremental sync.'
    },
    {
      id: 'hcx3-seed-replicator',
      name: 'HCX Background CBT Seed Replicator',
      category: 'Appliance',
      badge: 'Bulk Async Engine',
      xPercent: 46,
      yPercent: 36,
      shortDescription: 'High-speed asynchronous bulk replication engine copying multi-terabyte virtual disks in background.',
      fullDescription: 'Copies 99% of total VM storage footprint over the encrypted WAN tunnel while applications run in production, eliminating the risk of long maintenance windows.',
      role: 'Bulk Storage Seeding Engine',
      trafficDirection: 'Continuous background data replication to cloud target',
      highAvailability: 'Resilient against WAN disconnects with automatic resumption.',
      sizingAndConstraints: 'Transfers terabytes per hour depending on available underlay bandwidth.',
      portsTable: [
        { protocol: 'UDP', port: '4500', source: 'Source IX', destination: 'Target IX', purpose: 'Bulk replication data stream' }
      ],
      troubleshootingCli: [
        { command: 'Get-HCXMigration -Name "Oracle-Prod-01"', context: 'Check replication sync progress in PowerCLI', expectedOutput: 'Status: Syncing, BytesTransferred: 4.2 TB / 4.5 TB' }
      ],
      packetFlowSummary: 'Reads base virtual disk blocks -> compresses & encrypts -> writes to cloud destination datastore.'
    },
    {
      id: 'hcx3-delta-engine',
      name: 'Continuous Delta Sync Engine',
      category: 'Appliance',
      badge: 'Delta Convergence',
      xPercent: 50,
      yPercent: 62,
      shortDescription: 'Iterative delta sync engine capturing changed blocks until cutover window.',
      fullDescription: 'Continuously tracks and copies newly modified blocks to keep target disks synchronized within minutes of source production data.',
      role: 'Delta Block Synchronization',
      trafficDirection: 'Small incremental replication bursts',
      highAvailability: 'Maintains convergence readiness for scheduled cutover.',
      sizingAndConstraints: 'Reduces final memory stun window to under 1 second.',
      portsTable: [
        { protocol: 'TCP', port: '902', source: 'Source Host', destination: 'Target Host', purpose: 'Delta block synchronization' }
      ],
      troubleshootingCli: [
        { command: 'Get-HCXMigration | Select-Object Name, Progress, Phase', context: 'Verify delta sync status', expectedOutput: 'Phase: Continuous Delta Sync' }
      ],
      packetFlowSummary: 'Iteratively syncs changed blocks until delta size drops below memory stun threshold.'
    },
    {
      id: 'hcx3-rav-engine',
      name: 'Live vMotion Pre-Copy & Atomic Stun Window',
      category: 'Appliance',
      badge: 'Zero-Downtime Cutover',
      xPercent: 78,
      yPercent: 40,
      shortDescription: 'Executes rapid memory pre-copy and sub-second stun cutover with zero TCP dropped connections.',
      fullDescription: 'At scheduled cutover time, RAV triggers vMotion memory pre-copy, pauses source execution for < 1 second to copy dirty memory pages, transfers network ownership to cloud, and resumes execution seamlessly.',
      role: 'Zero-Downtime Memory Cutover',
      trafficDirection: 'High-speed vMotion memory page stream (TCP 8000) over encrypted tunnel',
      highAvailability: 'Automated rollback safety net preserves source VM if switchover fails.',
      sizingAndConstraints: 'Switchover executes in under 1 second without disconnecting database clients.',
      portsTable: [
        { protocol: 'TCP', port: '8000', source: 'Source ESXi vMotion vmknic', destination: 'Target ESXi vMotion vmknic', purpose: 'Live memory page transfer' }
      ],
      troubleshootingCli: [
        { command: 'Start-HCXMigration -Type RAV -SourceVM $vm -TargetComputePool $pool', context: 'Execute RAV migration via PowerCLI', expectedOutput: 'Task: In Progress (Syncing: 98%)' }
      ],
      packetFlowSummary: 'Disk is seeded asynchronously -> live memory is synchronized -> VM state flips atomically to cloud target.'
    }
  ],

  // ==========================================
  // 6. VMWARE SITE RECOVERY MANAGER (SRM)
  // ==========================================

  // SRM Design 1: Multi-Site DR & Failover Automation
  'srm-design-1': [
    {
      id: 'srm1-server-prod',
      name: 'Protected Site SRM & vCenter Server',
      category: 'Appliance',
      badge: 'Protected Site Hub',
      xPercent: 22,
      yPercent: 32,
      shortDescription: 'Central recovery management server executing automated recovery plans at production site.',
      fullDescription: 'Coordinates failover workflows, dependency sequencing, IP customization, and array replication split commands across protected and recovery sites.',
      role: 'Production Site DR Orchestration',
      trafficDirection: 'Outbound REST commands to vCenter, storage adapters, and recovery site SRM',
      highAvailability: 'Protected site and recovery site paired instances.',
      sizingAndConstraints: 'Manages up to 5,000 protected VMs per vCenter.',
      portsTable: [
        { protocol: 'TCP', port: '8095', source: 'Admin Console', destination: 'SRM Server', purpose: 'SRM management API' },
        { protocol: 'TCP', port: '9086', source: 'Protected SRM', destination: 'Recovery SRM', purpose: 'Site pairing & plan synchronization' }
      ],
      troubleshootingCli: [
        { command: 'systemctl status srm-service', context: 'Verify SRM daemon on management appliance', expectedOutput: 'Active: active (running)' }
      ],
      packetFlowSummary: 'Orders storage split -> powers on recovery VMs according to configured priority groups.'
    },
    {
      id: 'srm1-recovery-server',
      name: 'Recovery Site SRM & vCenter Server',
      category: 'Appliance',
      badge: 'Recovery Site Core',
      xPercent: 76,
      yPercent: 32,
      shortDescription: 'Recovery site management appliance ready to execute automated disaster recovery failover.',
      fullDescription: 'Monitors site pairing heartbeats. Upon failover command, orchestrates datastore mounting, virtual machine registration, IP address reconfiguration, and priority-based power-on sequencing.',
      role: 'Disaster Recovery Target Orchestrator',
      trafficDirection: 'Inbound commands from protected site; local orchestration commands to recovery ESXi cluster',
      highAvailability: 'Survives total destruction of protected site.',
      sizingAndConstraints: 'Symmetric capacity capable of hosting all protected workloads.',
      portsTable: [
        { protocol: 'TCP', port: '9086', source: 'Protected SRM', destination: 'Recovery SRM', purpose: 'Replication status polling' }
      ],
      troubleshootingCli: [
        { command: 'Get-RecoveryPlan | Select Name, Status', context: 'List active recovery plans in PowerCLI', expectedOutput: 'Name: Mission-Critical-Tier, Status: Ready' }
      ],
      packetFlowSummary: 'Receives failover trigger -> mounts recovery datastores -> powers on VMs in sequence.'
    },
    {
      id: 'srm1-priority-engine',
      name: 'Automated Priority Group Sequencer',
      category: 'Network & Routing',
      badge: 'Dependency Engine',
      xPercent: 50,
      yPercent: 48,
      shortDescription: 'Orchestrates multi-tier application boot dependencies (Database -> App -> Web Tier).',
      fullDescription: 'Ensures that databases power on first and reach healthy operational state before dependent application servers boot, preventing application startup failures and timeout cascades.',
      role: 'Startup Dependency Sequencing',
      trafficDirection: 'Automated guest tools post-boot heartbeat validation',
      highAvailability: '5 configurable priority tiers with customizable startup delays.',
      sizingAndConstraints: 'Executes pre-power-on and post-power-on script automation.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'Recovery SRM', destination: 'ESXi Host vCenter API', purpose: 'VM power-on commands' }
      ],
      troubleshootingCli: [
        { command: 'Get-RecoveryPlan "Tier1" | Test-RecoveryPlan', context: 'Run test failover simulation', expectedOutput: 'Status: Test Succeeded' }
      ],
      packetFlowSummary: 'Tier 1 (DB) boots -> VMware Tools reports OK -> Tier 2 (App) boots -> Tier 3 (Web) boots.'
    },
    {
      id: 'srm1-rep-highway',
      name: 'High-Speed Storage Replication Highway',
      category: 'Storage Fabric',
      badge: 'Zero-RPO Pipe',
      xPercent: 50,
      yPercent: 72,
      shortDescription: 'Dedicated dark fiber or hyperscaler link transporting synchronous/asynchronous block replication.',
      fullDescription: 'Transits block deltas continuously between primary and secondary storage fabrics with lowest latency to guarantee zero data loss mandates.',
      role: 'Continuous Storage Mirroring Link',
      trafficDirection: 'Continuous replication stream from protected to recovery arrays',
      highAvailability: 'Redundant diverse fiber paths.',
      sizingAndConstraints: 'Bandwidth sized to accommodate peak write change rates.',
      portsTable: [
        { protocol: 'Storage Protocol', port: '3260 / 2049', source: 'Primary Storage Array', destination: 'Secondary Storage Array', purpose: 'Block replication' }
      ],
      troubleshootingCli: [
        { command: 'esxcli storage core adapter list', context: 'Verify storage adapter state on ESXi', expectedOutput: 'Link: Connected, Speed: 32Gbps' }
      ],
      packetFlowSummary: 'Committed storage blocks are transmitted continuously to recovery site controllers.'
    }
  ],

  // SRM Design 2: Storage Replication Adapter (SRA) Array-Based Mirroring
  'srm-design-2': [
    {
      id: 'srm2-prod-array',
      name: 'Protected SAN/NAS Storage Array',
      category: 'Storage Fabric',
      badge: 'Primary LUNs',
      xPercent: 24,
      yPercent: 52,
      shortDescription: 'Hardware enterprise SAN/NAS storage array (NetApp, Dell PowerStore, Pure Storage).',
      fullDescription: 'Hosts primary VMFS or NFS datastores. Synchronously or asynchronously mirrors volume blocks across hardware storage controllers to secondary recovery array.',
      role: 'Primary Datastore Host',
      trafficDirection: 'Replication stream to target array; SCSI/NFS read-write to local ESXi hosts',
      highAvailability: 'Dual active storage controllers with NVRAM battery backup.',
      sizingAndConstraints: 'Array-based snapshot and volume mirroring with zero hypervisor CPU overhead.',
      portsTable: [
        { protocol: 'FCP / iSCSI', port: '3260', source: 'ESXi Host', destination: 'Primary Storage Controller', purpose: 'VMFS I/O' }
      ],
      troubleshootingCli: [
        { command: 'esxcli storage vmfs extent list', context: 'List active VMFS storage extents', expectedOutput: 'Extent Name: lun-vmfs-prod-01, State: Active' }
      ],
      packetFlowSummary: 'Array controllers capture block writes and stream to secondary array over dedicated replication links.'
    },
    {
      id: 'srm2-sra',
      name: 'Storage Replication Adapter (SRA) Driver',
      category: 'Storage Fabric',
      badge: 'Array Control Driver',
      xPercent: 50,
      yPercent: 34,
      shortDescription: 'Storage vendor adapter translating SRM commands to hardware storage array APIs.',
      fullDescription: 'The Storage Replication Adapter (SRA) acts as the bridge between SRM and hardware storage arrays (NetApp, Dell, Pure, HPE). It automates storage volume failover, taking read-only snapshots during DR tests and breaking replication relationships during disasters.',
      role: 'Storage Array Replication Orchestrator',
      trafficDirection: 'Outbound REST / XML commands to storage controllers',
      highAvailability: 'Integrated into SRM Appliance failover pair.',
      sizingAndConstraints: 'Compatible with certified SRA adapters; supports synchronous and asynchronous replication.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'SRM Server', destination: 'Storage Array Management VIP', purpose: 'SRA snapshot & failover orchestration' }
      ],
      troubleshootingCli: [
        { command: 'docker exec -it srm-appliance /opt/vmware/srm/bin/sra-test', context: 'Test SRA communication with storage controller', expectedOutput: 'SRA discoverDevices Succeeded' }
      ],
      packetFlowSummary: 'SRM orders failover -> SRA instructs SAN array to promote secondary LUN to read-write -> ESXi rescans SCSI bus and mounts VMFS datastore.'
    },
    {
      id: 'srm2-recovery-array',
      name: 'Target SAN/NAS Storage Array',
      category: 'Storage Fabric',
      badge: 'Recovery Target',
      xPercent: 76,
      yPercent: 52,
      shortDescription: 'Secondary enterprise storage array maintaining real-time replica volumes.',
      fullDescription: 'Holds mirror copies of all datastores. During non-disruptive DR drills, SRA commands the array to create temporary read-write writable snapshots for the test bubble without breaking replication.',
      role: 'Disaster Recovery Storage Target',
      trafficDirection: 'Receives storage replication stream; serves I/O during failover or DR tests',
      highAvailability: 'High-availability storage controller pair.',
      sizingAndConstraints: 'Matched capacity to source storage volumes.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'SRA Adapter', destination: 'Recovery Array API', purpose: 'Snapshot clone creation' }
      ],
      troubleshootingCli: [
        { command: 'Get-SrmProtectionGroup | Get-SrmProtectedVm', context: 'Verify SRM protected VM inventory in PowerCLI', expectedOutput: 'Protected VMs: 85, Status: Synchronized' }
      ],
      packetFlowSummary: 'Maintains replica LUNs in standby state until failover command is issued.'
    },
    {
      id: 'srm2-fiber-link',
      name: 'Hardware Storage Replication Link',
      category: 'Interconnect',
      badge: 'Storage Fiber',
      xPercent: 50,
      yPercent: 74,
      shortDescription: 'Dedicated Fibre Channel over IP (FCIP) or 100GbE dark fiber array replication link.',
      fullDescription: 'Connects primary and secondary storage controllers directly with line-rate performance and predictable latency.',
      role: 'Physical Storage Replication Highway',
      trafficDirection: 'Synchronous / asynchronous storage block mirroring',
      highAvailability: 'Redundant SAN fabric with dual fabric paths.',
      sizingAndConstraints: 'Low latency (< 5ms for synchronous replication).',
      portsTable: [
        { protocol: 'FCIP', port: '3225', source: 'SAN Switch 1', destination: 'SAN Switch 2', purpose: 'Fibre Channel over IP storage link' }
      ],
      troubleshootingCli: [
        { command: 'show fcip summary', context: 'Check FCIP tunnel state on SAN switch', expectedOutput: 'Tunnel: Online, Bandwidth: 16Gbps' }
      ],
      packetFlowSummary: 'Writes are replicated between array caches before database confirmation.'
    }
  ],

  // SRM Design 3: Non-Disruptive Test Bubble Failover Drills
  'srm-design-3': [
    {
      id: 'srm3-prod-site',
      name: 'Production Live Site (Zero Interruption)',
      category: 'Compute & Cluster',
      badge: 'Live Operations',
      xPercent: 22,
      yPercent: 40,
      shortDescription: 'Primary data center continuing to service real customer traffic during DR drill.',
      fullDescription: 'Because test failovers run in an isolated test bubble, production databases and customer applications experience zero stuns, zero downtime, and zero packet disruption during the test.',
      role: 'Live Production Data Center',
      trafficDirection: 'Normal live customer operations completely decoupled from DR test bubble',
      highAvailability: 'Uninterrupted 100% production availability.',
      sizingAndConstraints: 'No performance penalty on live workloads during DR drill.',
      portsTable: [
        { protocol: 'All', port: 'All', source: 'Live Clients', destination: 'Production VMs', purpose: 'Standard operational transactions' }
      ],
      troubleshootingCli: [
        { command: 'vmware -v', context: 'Check vSphere version on production ESXi host', expectedOutput: 'VMware ESXi 8.0.2 build-22380479' }
      ],
      packetFlowSummary: 'Live customer traffic flows normally through production switches without touching test bubble.'
    },
    {
      id: 'srm3-bubble',
      name: 'Isolated Test Bubble Portgroup',
      category: 'Network & Routing',
      badge: 'Zero-Impact Sandbox',
      xPercent: 74,
      yPercent: 44,
      shortDescription: 'Dedicated private vSphere portgroup enabling automated DR drills without touching production networks.',
      fullDescription: 'The SRM Test Bubble is an isolated, non-routable virtual network created automatically during disaster recovery testing drills. Virtual machines are powered on using production IP addresses, allowing application owners to test database integrity and multi-tier application startup dependencies without creating IP conflicts with the live production site.',
      role: 'Non-Disruptive DR Drill Sandbox',
      trafficDirection: 'Isolated east-west communications within the DR test bubble only',
      highAvailability: 'Isolated vSwitch/NSX segment; discarded automatically upon test completion.',
      sizingAndConstraints: 'Supports identical IP and MAC configurations without network collisions.',
      portsTable: [
        { protocol: 'All', port: 'All', source: 'Test VM Tier-1', destination: 'Test VM Tier-2', purpose: 'Full app stack testing inside isolated boundary' }
      ],
      troubleshootingCli: [
        { command: 'Get-RecoveryPlan "Tier-1-Apps" | Test-RecoveryPlan', context: 'Execute automated DR drill in isolated bubble', expectedOutput: 'Test Succeeded - 42 VMs powered on in test bubble, 0 errors' }
      ],
      packetFlowSummary: 'Production site continues serving live users -> recovery site powers on replica VMs attached to isolated test bubble portgroup -> audit passes.'
    },
    {
      id: 'srm3-audit-engine',
      name: 'Automated DR Audit Report Generator',
      category: 'Appliance',
      badge: 'Audit & Compliance',
      xPercent: 50,
      yPercent: 24,
      shortDescription: 'Generates cryptographic compliance reports certifying RTO and RPO benchmarks.',
      fullDescription: 'Produces PDF/HTML audit reports detailing precise boot times for every virtual machine, script execution logs, and compliance verification for regulatory auditors (SOC2, HIPAA, PCI-DSS).',
      role: 'Disaster Recovery Compliance Verifier',
      trafficDirection: 'Internal reporting logs exportable via HTTPS',
      highAvailability: 'Historical test results stored indefinitely in SRM database.',
      sizingAndConstraints: 'Exports full audit logs for thousands of test runs.',
      portsTable: [
        { protocol: 'HTTPS', port: '443', source: 'Auditor Browser', destination: 'SRM Report Portal', purpose: 'Download compliance PDF' }
      ],
      troubleshootingCli: [
        { command: 'Get-RecoveryPlanResult -PlanName "All-Apps"', context: 'Query latest DR test execution report', expectedOutput: 'Result: Succeeded, Total Execution Time: 4m 12s' }
      ],
      packetFlowSummary: 'Records step-by-step timestamps of VM boot events -> compiles cryptographic audit report.'
    },
    {
      id: 'srm3-temp-snapshots',
      name: 'Temporary Snapshot Datastores',
      category: 'Storage Fabric',
      badge: 'Instant Rollback',
      xPercent: 74,
      yPercent: 72,
      shortDescription: 'Hardware-writable storage snapshots cloned for test bubble execution.',
      fullDescription: 'Test virtual machines write to ephemeral storage snapshots during the test drill. When the drill completes, SRM deletes the temporary snapshots and resets the storage without altering replica data.',
      role: 'Ephemeral Test Storage Target',
      trafficDirection: 'Read/write storage I/O during test drills only',
      highAvailability: 'Disposed cleanly upon test termination.',
      sizingAndConstraints: 'Zero impact on replication stream.',
      portsTable: [
        { protocol: 'SCSI / NFS', port: '3260 / 2049', source: 'Test VM', destination: 'Snapshot Datastore', purpose: 'Test execution I/O' }
      ],
      troubleshootingCli: [
        { command: 'esxcli storage filesystem list | grep "snap-"', context: 'Verify ephemeral test snapshot datastores', expectedOutput: 'Mounted: true, Type: VMFS-6' }
      ],
      packetFlowSummary: 'Test VMs write modifications to snapshot -> test ends -> SRM unmounts and deletes snapshot.'
    }
  ],

  // ==========================================
  // 7. ARIA OPERATIONS FOR NETWORKS
  // ==========================================

  // Aria Design 1: Flow Discovery & Real-Time NetFlow Analytics
  'aria-design-1': [
    {
      id: 'aria1-flow',
      name: 'Flow Discovery & NetFlow Engine',
      category: 'Security & Firewall',
      badge: '360° Flow Visibility',
      xPercent: 48,
      yPercent: 44,
      shortDescription: 'Continuous IPFIX and NetFlow collector discovering application communication boundaries.',
      fullDescription: 'VMware Aria Operations for Networks ingests real-time IPFIX flow logs directly from distributed virtual switches, NSX components, and physical switches. It analyzes millions of packets to map inter-application dependencies, identifies exposed ports, and generates microsegmentation firewall rules automatically.',
      role: 'Deep Network Flow Analytics & Planning',
      trafficDirection: 'Inbound UDP flow streams from hypervisors and network gear',
      highAvailability: 'Clustered platform architecture with elastic search data nodes.',
      sizingAndConstraints: 'Processes up to 500,000 flows per second with 30-day raw flow retention.',
      portsTable: [
        { protocol: 'UDP', port: '2055', source: 'vSphere vDS / NSX', destination: 'Aria Collector Appliance', purpose: 'IPFIX flow telemetry streams' }
      ],
      troubleshootingCli: [
        { command: 'tcpdump -i eth0 -n udp port 2055', context: 'Verify active IPFIX stream arrival at Aria Collector', expectedOutput: 'IP 10.0.1.25 > 10.0.2.10.2055: UDP, length 1472' }
      ],
      packetFlowSummary: 'Host switches mirror flow headers -> send IPFIX packets to Aria Collector -> Aria correlates source/dest IPs with vCenter VM tags.'
    },
    {
      id: 'aria1-ipfix-collectors',
      name: 'Distributed IPFIX Telemetry Collectors',
      category: 'Appliance',
      badge: 'Telemetry Probes',
      xPercent: 20,
      yPercent: 42,
      shortDescription: 'Collector appliances deployed across on-premises and hyperscaler SDDCs polling switch metrics.',
      fullDescription: 'Lightweight virtual appliances deployed in remote clusters that collect flow metadata, SNMP tables, and BGP routing ribs, batching telemetry securely back to the central analytics cluster.',
      role: 'Distributed Network Telemetry Harvester',
      trafficDirection: 'Inbound SNMP/IPFIX from local gear; outbound TLS to central Aria platform',
      highAvailability: 'Scales to multiple collectors per regional data center.',
      sizingAndConstraints: 'Handles 100,000 flows/second per collector node.',
      portsTable: [
        { protocol: 'UDP', port: '2055 / 4739', source: 'Virtual Switch / TOR', destination: 'Collector Appliance', purpose: 'Flow export' }
      ],
      troubleshootingCli: [
        { command: 'systemctl status collector-service', context: 'Check collector health on proxy appliance', expectedOutput: 'active (running)' }
      ],
      packetFlowSummary: 'Collects flow packets locally -> aggregates into compressed telemetry streams -> transmits to analysis cluster.'
    },
    {
      id: 'aria1-clustering-engine',
      name: 'ML Application Tier Clustering Engine',
      category: 'Appliance',
      badge: 'AI Tier Profiler',
      xPercent: 76,
      yPercent: 36,
      shortDescription: 'Machine learning algorithms clustering VMs into multi-tier applications based on flow density.',
      fullDescription: 'Discovers previously undocumented application architectures by analyzing conversation frequencies, identifying web, middleware, and database tiers without requiring manual spreadsheet tracking.',
      role: 'Automated Application Topology Mapping',
      trafficDirection: 'Analytical correlation of historical flow database',
      highAvailability: 'Distributed across analytics cluster.',
      sizingAndConstraints: 'Clusters tens of thousands of VMs within minutes.',
      portsTable: [
        { protocol: 'HTTPS', port: '443', source: 'Architect Browser', destination: 'Aria Platform VIP', purpose: 'Application topology visualization' }
      ],
      troubleshootingCli: [
        { command: 'aria-cli get-applications', context: 'List discovered applications in Aria CLI', expectedOutput: 'Found 48 Applications (SAP, e-Commerce, Billing, Epic)' }
      ],
      packetFlowSummary: 'Groups virtual machines by reciprocal TCP flows -> outputs tiered application dependency boundary.'
    },
    {
      id: 'aria1-realtime-canvas',
      name: 'Real-Time Dependency Matrix',
      category: 'Network & Routing',
      badge: 'Interactive Flow View',
      xPercent: 50,
      yPercent: 68,
      shortDescription: 'Interactive graphical visualization of live east-west network packet exchanges.',
      fullDescription: 'Visualizes exact port numbers, protocols, and dropped packets between microservices, allowing architects to plan zero-trust rules with 100% confidence.',
      role: 'Visual Traffic Flow Navigator',
      trafficDirection: 'Interactive web UI telemetry streaming',
      highAvailability: 'Elastic search visualizer.',
      sizingAndConstraints: 'Renders sub-second query responses across billions of flow records.',
      portsTable: [
        { protocol: 'WSS', port: '443', source: 'Web UI', destination: 'Aria Analytics Cluster', purpose: 'Live WebSocket telemetry stream' }
      ],
      troubleshootingCli: [
        { command: 'aria-cli query "flows where flowType = \'East-West\'"', context: 'Query live east-west flows', expectedOutput: 'Total flows matched: 12,482' }
      ],
      packetFlowSummary: 'Renders interactive nodes and glowing flow lines showing active packet exchange rates.'
    }
  ],

  // Aria Design 2: Microsegmentation Planning & DFW Policy Formulation
  'aria-design-2': [
    {
      id: 'aria2-microseg',
      name: 'Microsegmentation Rule Generator',
      category: 'Security & Firewall',
      badge: 'Zero-Trust Planner',
      xPercent: 50,
      yPercent: 36,
      shortDescription: 'Automated clustering algorithm grouping VMs by shared communication patterns.',
      fullDescription: 'Groups workloads into tiers and exports mathematically verified NSX Distributed Firewall rules with zero guessing and zero disruption.',
      role: 'Zero-Trust Rule Formulator',
      trafficDirection: 'Analysis of historic east-west communication tables',
      highAvailability: 'Integrated into Aria Platform cluster.',
      sizingAndConstraints: 'Recommends policies for up to 50,000 concurrent VMs.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'Aria Operations', destination: 'NSX Manager Policy API', purpose: 'Direct export of recommended DFW rules' }
      ],
      troubleshootingCli: [
        { command: 'aria-cli export-microseg-rules --app "SAP-ERP" --format json', context: 'Export recommended firewall rules', expectedOutput: 'Rules exported successfully: 24 rules generated' }
      ],
      packetFlowSummary: 'Analyzes 30 days of traffic -> generates least-privilege security groups -> publishes directly into NSX Policy Manager.'
    },
    {
      id: 'aria2-traffic-matrix',
      name: 'Inter-Tier Communication Matrix',
      category: 'Security & Firewall',
      badge: 'Flow Matrix',
      xPercent: 22,
      yPercent: 42,
      shortDescription: 'Comprehensive matrix indexing every permitted port and protocol between tiers.',
      fullDescription: 'Highlights anomalous, unknown, and unencrypted traffic flows (e.g. plain HTTP, Telnet) requiring remediation before enterprise zero-trust policy lockdown.',
      role: 'Communication Baseline Matrix',
      trafficDirection: 'Analysis of historic east-west communication tables',
      highAvailability: 'Comprehensive historical flow ledger.',
      sizingAndConstraints: 'Analyzes up to 30 days of continuous flow data.',
      portsTable: [
        { protocol: 'All', port: 'All', source: 'Tier Matrix Engine', destination: 'Historical Database', purpose: 'Flow pattern cross-referencing' }
      ],
      troubleshootingCli: [
        { command: 'aria-cli analyze-traffic --app "Payments"', context: 'Identify unencrypted or unauthorized ports', expectedOutput: 'Warning: 2 VMs communicating over insecure port 23 (Telnet)' }
      ],
      packetFlowSummary: 'Correlates every historical connection attempt to determine exact firewall rule boundaries.'
    },
    {
      id: 'aria2-policy-publisher',
      name: 'Automated NSX DFW Policy Publisher',
      category: 'Network & Routing',
      badge: 'Policy Export API',
      xPercent: 76,
      yPercent: 38,
      shortDescription: 'One-click automated export pushing least-privilege firewall rules directly into NSX Manager.',
      fullDescription: 'Eliminates human syntax errors by translating recommended security policies directly into NSX-T declarative REST API JSON payloads, enforcing microsegmentation in seconds.',
      role: 'Automated Firewall Rule Provisioner',
      trafficDirection: 'Outbound REST API payload to NSX Policy Manager',
      highAvailability: 'Idempotent API publishing with validation rollback.',
      sizingAndConstraints: 'Publishes hundreds of firewall rules in a single API transaction.',
      portsTable: [
        { protocol: 'HTTPS', port: '443', source: 'Aria Operations', destination: 'NSX Policy Manager API', purpose: 'Push security policy payload' }
      ],
      troubleshootingCli: [
        { command: 'curl -kv -u admin:***** https://<nsx-mgr>/policy/api/v1/infra/domains/default/security-policies', context: 'Verify published security policies in NSX', expectedOutput: 'HTTP/1.1 200 OK' }
      ],
      packetFlowSummary: 'Translates analyzed network flows -> generates least-privilege JSON policy -> installs into ESXi DFW filters.'
    },
    {
      id: 'aria2-risk-scorer',
      name: 'Port & Risk Exposure Analyzer',
      category: 'Security & Firewall',
      badge: 'Risk Analyzer',
      xPercent: 50,
      yPercent: 68,
      shortDescription: 'Calculates vulnerability risk scores based on exposed internet ports and lateral movement paths.',
      fullDescription: 'Simulates attack vectors and calculates blast-radius impact if an external web server is breached, guiding security engineers to plug lateral security holes.',
      role: 'Zero-Trust Attack Surface Assessor',
      trafficDirection: 'Algorithmic security scoring',
      highAvailability: 'Continuous security audit updates.',
      sizingAndConstraints: 'Updates risk scores in real-time as new workloads come online.',
      portsTable: [
        { protocol: 'HTTPS', port: '443', source: 'Security Auditor', destination: 'Aria Risk Dashboard', purpose: 'Risk posture review' }
      ],
      troubleshootingCli: [
        { command: 'aria-cli get-risk-score --scope "Production"', context: 'Check current microsegmentation risk rating', expectedOutput: 'Risk Score: 18/100 (Low Risk, Microsegmented)' }
      ],
      packetFlowSummary: 'Evaluates firewall rule completeness -> flags any wildcard "ANY:ANY" allow rules as high security risk.'
    }
  ],

  // Aria Design 3: Hybrid Path Topology Tracer & Drop Diagnostics
  'aria-design-3': [
    {
      id: 'aria3-source-host',
      name: 'Source ESXi Host & vDS Switch',
      category: 'Compute & Cluster',
      badge: 'Source Endpoint',
      xPercent: 20,
      yPercent: 48,
      shortDescription: 'Starting point of end-to-end hop trace on source hypervisor distributed virtual switch (vDS).',
      fullDescription: 'Inspects virtual switch port, vNIC MAC address, Geneve encapsulation status, and MTU configuration at the very moment a packet leaves the source virtual machine.',
      role: 'Trace Origin Endpoint',
      trafficDirection: 'Outbound packet egress hop',
      highAvailability: 'vDS distributed across all cluster hosts.',
      sizingAndConstraints: 'Polls physical NIC drop counters and Geneve encapsulation health.',
      portsTable: [
        { protocol: 'Geneve / IP', port: '6081', source: 'Source VM', destination: 'Source vDS Port', purpose: 'Packet entry point' }
      ],
      troubleshootingCli: [
        { command: 'esxcli network vswitch dvs vmware list', context: 'Check source vDS switch health', expectedOutput: 'Status: Connected, Uplinks: 2 (vmnic0, vmnic1)' }
      ],
      packetFlowSummary: 'VM sends packet -> Aria traces packet onto specific vDS port and physical uplink.'
    },
    {
      id: 'aria3-carrier-transit',
      name: 'ExpressRoute / Direct Connect Carrier Transit',
      category: 'Interconnect',
      badge: 'Physical Transit Hop',
      xPercent: 40,
      yPercent: 48,
      shortDescription: 'Physical carrier underlay circuit and edge router hops connecting enterprise to cloud.',
      fullDescription: 'Correlates router BGP routing tables, physical interface drop counters, and optical link latency metrics, isolating intermediate carrier network congestion in real-time.',
      role: 'Hybrid Carrier Transit Hop',
      trafficDirection: 'Physical underlay transport hop',
      highAvailability: 'Dual carrier redundant paths.',
      sizingAndConstraints: 'Measures latency and MTU boundaries at physical router interfaces.',
      portsTable: [
        { protocol: 'SNMP / SSH', port: '161', source: 'Aria Collector', destination: 'Carrier Border Router', purpose: 'Interface drop counter polling' }
      ],
      troubleshootingCli: [
        { command: 'aria-cli trace-path --source 192.168.1.10 --dest 10.200.1.5', context: 'Execute path trace in Aria CLI', expectedOutput: 'Hop 3: Carrier Edge MSEE-1 [Latency: 1.2ms, Drops: 0]' }
      ],
      packetFlowSummary: 'Packet crosses physical WAN link -> Aria measures exact propagation latency and verifies zero packet drops.'
    },
    {
      id: 'aria3-cloud-gateway',
      name: 'Cloud NSX Tier-0 Gateway & Interconnect Edge',
      category: 'Network & Routing',
      badge: 'Cloud Edge Hop',
      xPercent: 62,
      yPercent: 48,
      shortDescription: 'Target cloud edge router receiving packet and decapsulating Geneve overlay headers.',
      fullDescription: 'Inspects cloud edge routing tables, firewall rule evaluation, and route redistribution metrics to ensure the packet is allowed into the target SDDC without policy drops.',
      role: 'Cloud Edge Ingress Hop',
      trafficDirection: 'Decapsulation and routing to internal cloud overlay segment',
      highAvailability: 'Active/Active ECMP edge cluster.',
      sizingAndConstraints: 'Verifies matching MTU (9000 bytes) between carrier link and cloud edge.',
      portsTable: [
        { protocol: 'Geneve', port: '6081', source: 'Cloud Edge', destination: 'Cloud Target Host', purpose: 'Overlay forwarding to host' }
      ],
      troubleshootingCli: [
        { command: 'get logical-router <t0-id> forwarding', context: 'Verify route lookup on destination Edge', expectedOutput: 'Next Hop: 100.64.1.4 (Tier-1 Gateway)' }
      ],
      packetFlowSummary: 'Edge router looks up routing rib -> verifies firewall policies -> forwards packet to destination host.'
    },
    {
      id: 'aria3-dest-endpoint',
      name: 'Destination Cloud VM & MTU Verifier',
      category: 'Compute & Cluster',
      badge: 'Target Endpoint',
      xPercent: 82,
      yPercent: 48,
      shortDescription: 'Destination virtual machine vNIC in hyperscaler SDDC confirming successful packet arrival.',
      fullDescription: 'Traces the precise hop-by-hop path between any two VMs or endpoints across physical switches, firewalls, Direct Connect / ExpressRoute circuits, and NSX Geneve overlays, instantly isolating dropped packets and misconfigured MTU boundaries.',
      role: 'End-to-End Hybrid Path Diagnostics',
      trafficDirection: 'Final packet delivery and acknowledgment',
      highAvailability: 'Real-time telemetry updated every 30 seconds.',
      sizingAndConstraints: 'Traces paths across up to 30 intermediate hops in < 3 seconds.',
      portsTable: [
        { protocol: 'TCP / UDP', port: 'Any', source: 'Source VM', destination: 'Destination VM', purpose: 'Application packet delivery' }
      ],
      troubleshootingCli: [
        { command: 'aria-cli trace-path --source 192.168.1.10 --dest 10.200.1.5', context: 'Execute path trace in Aria CLI', expectedOutput: 'Path: VM-1 -> vDS-1 -> TOR-1 -> ExpressRoute -> MSEE -> NSX-T0 -> VM-2 [0 drops, Total Latency: 3.4ms]' }
      ],
      packetFlowSummary: 'Correlates VM MAC/IP with switch CAM tables and BGP routing ribs -> renders visual path with hop latency and packet drop markers.'
    }
  ],

  // ==========================================
  // 8. NUTANIX CLOUD CLUSTERS (NC2) ON AZURE
  // ==========================================

  // NC2 Design 1: Azure Bare-Metal Node Architecture & Flow Virtual Networking
  'nc2-design-1': [
    {
      id: 'nc2-1-an-nodes',
      name: 'Azure Bare-Metal Compute Nodes (AN36 / AN64 / AN100)',
      category: 'Compute & Cluster',
      badge: 'Bare-Metal Node SKUs',
      xPercent: 78,
      yPercent: 32,
      shortDescription: 'Dedicated Azure bare-metal hardware running Nutanix AHV hypervisor without nested virtualization penalties.',
      fullDescription: 'High-density physical nodes (AN36: 36c/72t, 768GB RAM; AN36P: 1.5TB RAM; AN64: 64c/128t, 1.5TB RAM; AN100: 104c/208t, 2TB RAM) with dual-port 100GbE physical NICs and PCIe NVMe solid-state storage. Physical hypervisors boot directly from Azure storage fabrics, achieving native CPU execution speeds for demanding enterprise database workloads.',
      role: 'Hyperconverged Bare-Metal Execution Node',
      trafficDirection: 'Internal node interconnect and Azure VNet egress',
      highAvailability: 'Host auto-remediation via Nutanix cluster healing; failed nodes replaced within Azure portal in minutes.',
      sizingAndConstraints: 'Minimum 3 nodes per NC2 cluster; scales up to 28 nodes per Nutanix AOS storage cluster.',
      portsTable: [
        { protocol: 'TCP', port: '9440', source: 'Admin Workstation', destination: 'Prism Element / Central', purpose: 'Prism Management HTTPS console' },
        { protocol: 'TCP', port: '22', source: 'Management Subnet', destination: 'AHV Hypervisor Host', purpose: 'SSH administration interface' }
      ],
      troubleshootingCli: [
        { command: 'ncli host list', context: 'Inspect status and hardware inventory of physical bare-metal hosts', expectedOutput: 'Host 1: AN64, Hypervisor: AHV, State: Normal' },
        { command: 'cluster status', context: 'Verify overall AOS cluster operational status', expectedOutput: 'State: UP, All services running normally' }
      ],
      packetFlowSummary: 'User VMs execute directly on bare-metal Intel Xeon silicon -> I/O trapped by AHV kernel -> forwarded directly to Controller VM (CVM) or Azure physical NIC.'
    },
    {
      id: 'nc2-1-cvm-fabric',
      name: 'Nutanix Controller VM (CVM) Storage Fabric',
      category: 'Storage Fabric',
      badge: 'CVM Storage Core',
      xPercent: 48,
      yPercent: 52,
      shortDescription: 'Dedicated storage controller VM per host clustering local NVMe drives into global Distributed Storage Fabric.',
      fullDescription: 'The CVM bypasses hypervisor abstraction via PCI pass-through to manage local high-speed NVMe drives directly. CVMs across the entire bare-metal cluster communicate over an isolated backplane network to deliver linear IOPS scaling, data locality, dynamic cache management, and automated multi-copy replication.',
      role: 'Distributed Storage & Management Engine',
      trafficDirection: 'Intra-cluster storage replication and I/O handling',
      highAvailability: 'Auto-pathing reroutes I/O to surviving peer CVMs in under 200ms if a local CVM restarts.',
      sizingAndConstraints: 'Allocates 32 GB to 64 GB RAM and 8 to 12 vCPUs per host based on active storage services.',
      portsTable: [
        { protocol: 'TCP', port: '2020', source: 'CVM', destination: 'Peer CVMs', purpose: 'Stargate cluster metadata coordination' },
        { protocol: 'TCP', port: '3260', source: 'AHV Hypervisor', destination: 'Local CVM', purpose: 'iSCSI data path for VM virtual disks' }
      ],
      troubleshootingCli: [
        { command: 'nodetool -h 127.0.0.1 ring', context: 'Inspect Cassandra distributed metadata ring health', expectedOutput: 'All Cassandra tokens balanced and healthy' },
        { command: 'svmips', context: 'List all active CVM IP addresses across the cluster', expectedOutput: '10.20.1.11 10.20.1.12 10.20.1.13' }
      ],
      packetFlowSummary: 'VM disk write request -> received by local CVM Stargate process -> committed to local NVMe tier -> replicated synchronously across peer node CVMs before ACK.'
    },
    {
      id: 'nc2-1-flow-vnet',
      name: 'Flow Virtual Networking & Native Azure VNet Flow',
      category: 'Network & Routing',
      badge: 'Native Azure VNet SDN',
      xPercent: 88,
      yPercent: 62,
      shortDescription: 'Native Azure VNet integration without nested virtualization or double-encapsulation penalties.',
      fullDescription: 'Nutanix Flow Virtual Networking integrates directly with Azure Virtual Network APIs. User VM interfaces receive secondary private IP addresses directly from Azure subnets, enabling seamless communication with Azure native services (Azure SQL, Cosmos DB, Azure NetApp Files) with zero routing encapsulation overhead.',
      role: 'Software-Defined Network & Azure Fabric Bridge',
      trafficDirection: 'East-West inter-VM and North-South Azure cloud connectivity',
      highAvailability: 'Redundant Azure NIC attachments with automated link failover.',
      sizingAndConstraints: 'Supports native microsegmentation, VPC overlays, dynamic routing (BGP), and floating IPs.',
      portsTable: [
        { protocol: 'Any', port: 'All', source: 'User VM', destination: 'Azure Spoke VNet', purpose: 'Direct line-rate Azure VNet transit' }
      ],
      troubleshootingCli: [
        { command: 'az network nic show -g <rg> -n <nc2-nic-name> --query "ipConfigurations[].privateIpAddress"', context: 'List private IPs assigned by Azure to Nutanix AHV nodes', expectedOutput: '["10.0.1.10", "10.0.1.11", "10.0.1.12"]' }
      ],
      packetFlowSummary: 'Packet leaves User VM vNIC -> Flow SDN classifies packet -> forwards directly through Azure physical NIC into customer Azure VNet with zero overlay encapsulation penalty.'
    },
    {
      id: 'nc2-1-expressroute',
      name: 'Azure ExpressRoute FastPath & Hybrid Interconnect',
      category: 'Interconnect',
      badge: 'FastPath 100G Transit',
      xPercent: 18,
      yPercent: 48,
      shortDescription: 'Direct hardware-level hybrid routing connecting on-premises vSphere datacenters to NC2 bare-metal nodes.',
      fullDescription: 'Dedicated Azure ExpressRoute circuit with FastPath enabled. Traffic flows directly between physical datacenter edge routers and NC2 bare-metal hypervisors, bypassing Azure GatewaySubnet CPU limits to deliver line-rate 10Gbps to 100Gbps throughput with sub-millisecond network latency.',
      role: 'Enterprise Hybrid Cloud Border Transit',
      trafficDirection: 'Bidirectional on-premises to NC2 cluster traffic',
      highAvailability: 'Dual active/active ExpressRoute carrier circuits with sub-second BGP failover.',
      sizingAndConstraints: 'Requires UltraPerformance or ErGw3AZ gateway SKU for line-rate FastPath routing.',
      portsTable: [
        { protocol: 'TCP', port: '179', source: 'On-Premises Edge', destination: 'Azure MSEE Edge', purpose: 'BGP dynamic route advertisement' }
      ],
      troubleshootingCli: [
        { command: 'az network express-route list -g <rg> -o table', context: 'Verify ExpressRoute circuit operational status and provisioning state', expectedOutput: 'ProvisioningState: Succeeded, CircuitState: Enabled' }
      ],
      packetFlowSummary: 'Packets traverse dedicated fiber -> land on MSEE router -> FastPath hardware switches frame directly to NC2 bare-metal host interfaces.'
    }
  ],

  // NC2 Design 2: Nutanix Move Automated Cross-Hypervisor Migration Pipeline (vSphere to AHV)
  'nc2-design-2': [
    {
      id: 'nc2-2-move-appliance',
      name: 'Nutanix Move Appliance & Orchestration Engine',
      category: 'Appliance',
      badge: 'Move Migration Engine',
      xPercent: 50,
      yPercent: 44,
      shortDescription: 'Linux-based migration coordinator managing vCenter snapshots, byte delta streaming, and cutover execution.',
      fullDescription: 'Nutanix Move deploys as a turnkey virtual appliance. It connects via REST APIs to VMware vCenter and Nutanix Prism, orchestrating batch migration waves, tracking background replication progress, and automating guest OS readiness verification with minimal administrative touch.',
      role: 'Central Cross-Hypervisor Migration Controller',
      trafficDirection: 'Control-plane orchestration with vCenter and destination NC2 Prism',
      highAvailability: 'Stateless job persistence; automatically resumes replication streams following transient WAN disruptions.',
      sizingAndConstraints: 'Single appliance handles up to 64 concurrent VM replication streams across 1Gbps to 40Gbps WAN pipelines.',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'Move Appliance', destination: 'vCenter Server', purpose: 'vSphere API snapshot and inventory queries' },
        { protocol: 'TCP', port: '9440', source: 'Move Appliance', destination: 'Nutanix Prism', purpose: 'Prism Element / Central storage target APIs' }
      ],
      troubleshootingCli: [
        { command: 'move-cli migration-plan list', context: 'Query active migration wave status and sync progress', expectedOutput: 'Plan: Wave-1-Databases, State: In-Sync, Lag: < 15s' },
        { command: 'move-cli status', context: 'Check Move service daemon health', expectedOutput: 'All Move microservices running healthy' }
      ],
      packetFlowSummary: 'Move appliance coordinates vCenter snapshot -> reads VMDK blocks -> encrypts stream -> pushes directly into destination NC2 CVM storage pool.'
    },
    {
      id: 'nc2-2-cbt-sync',
      name: 'Agentless Changed Block Tracking (CBT) Delta Sync',
      category: 'Compute & Cluster',
      badge: 'CBT Delta Replicator',
      xPercent: 28,
      yPercent: 38,
      shortDescription: 'Continuous byte-level tracking capturing incremental block changes while source VMs remain online in production.',
      fullDescription: 'Leverages native VMware vSphere Changed Block Tracking (CBT) without requiring any software agents installed inside guest virtual machines. Performs an initial baseline disk seed, followed by scheduled hourly or continuous delta synchronizations that copy only modified disk sectors.',
      role: 'Non-Disruptive Changed Data Replicator',
      trafficDirection: 'Outbound replication data stream from on-premises ESXi to NC2 storage',
      highAvailability: 'Resilient multi-threaded streaming with checksum validation on every transferred sector block.',
      sizingAndConstraints: 'Minimal ESXi host CPU overhead (< 2%); bandwidth throttling customizable to prevent WAN saturation.',
      portsTable: [
        { protocol: 'TCP', port: '902', source: 'Move Appliance', destination: 'ESXi Host', purpose: 'NFC (Network File Copy) block transfer protocol' }
      ],
      troubleshootingCli: [
        { command: 'vim-cmd vmsvc/get.snapshotinfo <vmid>', context: 'Inspect source VM snapshot chain and CBT tracking flag', expectedOutput: 'ctkEnabled: true, Snapshot: Move-Migration-Sync' }
      ],
      packetFlowSummary: 'VM writes data -> ESXi CBT tracks changed sector IDs -> Move queries modified blocks -> streams only deltas over ExpressRoute circuit.'
    },
    {
      id: 'nc2-2-virtio-inject',
      name: 'Automated VirtIO Driver Injection Engine',
      category: 'Compute & Cluster',
      badge: 'VirtIO OS Injection',
      xPercent: 54,
      yPercent: 20,
      shortDescription: 'Automatically injects Red Hat / Nutanix VirtIO storage and network drivers into guest Windows and Linux kernels.',
      fullDescription: 'Prior to cutover, Nutanix Move mounts the target replica disk and injects certified VirtIO-SCSI storage drivers, VirtIO network controllers, and Nutanix Guest Tools (NGT). This eliminates blue-screen (BSOD) stop errors and kernel panics when the VM first powers on on the native AHV hypervisor.',
      role: 'Guest OS Cross-Hypervisor Translator',
      trafficDirection: 'Offline disk sector modification on replica storage volume',
      highAvailability: 'Automatic backup copy of source registry and initramfs files preserved for safety.',
      sizingAndConstraints: 'Supports Windows Server 2008 R2 through 2025 and all enterprise Linux distributions (RHEL, Ubuntu, SUSE, Debian).',
      portsTable: [
        { protocol: 'TCP', port: '443', source: 'Move Appliance', destination: 'Guest VM (Optional)', purpose: 'Guest integration agent verification' }
      ],
      troubleshootingCli: [
        { command: 'move-cli vm verify-drivers --vm-id <id>', context: 'Verify successful installation of VirtIO drivers in target replica disk', expectedOutput: 'VirtIO-SCSI: Injected, VirtIO-Net: Injected, ReadyForBoot: True' }
      ],
      packetFlowSummary: 'Move accesses target disk image -> stages VirtIO driver binaries in System32 / initramfs -> updates boot loader registry -> prepares instant AHV boot.'
    },
    {
      id: 'nc2-2-disk-convert',
      name: 'Disk Controller Conversion (PVSCSI/LSI to VirtIO-SCSI)',
      category: 'Storage Fabric',
      badge: 'Controller Translation',
      xPercent: 68,
      yPercent: 48,
      shortDescription: 'Converts legacy VMware Paravirtual SCSI and LSI Logic SAS controllers into high-throughput VirtIO-SCSI.',
      fullDescription: 'Reconfigures virtual hardware definitions so that disks boot directly onto native AHV VirtIO-SCSI controllers. VirtIO-SCSI provides multi-queue I/O processing, deep queue depths (up to 256 requests per target), and ultra-low CPU latency, maximizing IOPS performance on Azure NVMe storage.',
      role: 'Virtual Storage Controller Modernizer',
      trafficDirection: 'Internal virtual hardware translation',
      highAvailability: 'Preserves original disk UUIDs, volume labels, and partition tables with 100% data integrity.',
      sizingAndConstraints: 'Supports up to 256 virtual disks per VM and individual disk sizes up to 64 TB.',
      portsTable: [
        { protocol: 'Internal', port: 'PCIe', source: 'AHV Hypervisor', destination: 'VirtIO Controller', purpose: 'Hardware-assisted disk I/O virtualization' }
      ],
      troubleshootingCli: [
        { command: 'acli vm.get <vm-name>', context: 'Inspect converted VM hardware bus controller types on AHV', expectedOutput: 'disk_address: bus: scsi, index: 0, model: virtio-scsi' }
      ],
      packetFlowSummary: 'Guest operating system issues SCSI read/write -> processed via multi-queue VirtIO-SCSI driver -> executed directly by AHV kernel.'
    },
    {
      id: 'nc2-2-l2-stretch',
      name: 'Flow Layer 2 Subnet Extension & IP Address Preservation',
      category: 'Network & Routing',
      badge: 'Flow L2 Stretch Gateway',
      xPercent: 82,
      yPercent: 74,
      shortDescription: 'Extends enterprise on-premises broadcast VLANs into Azure VNet, preserving existing static IP and MAC addresses.',
      fullDescription: 'Nutanix Flow L2 Network Extension deploys an encrypted bridge pair between on-premises VMware switches and Azure NC2 Flow networks. Virtual machines cut over into Azure keep their original IP addresses, subnet masks, and default gateways, eliminating application downtime and complex DNS re-addressing during multi-wave migration.',
      role: 'Cross-Cloud Broadcast Domain Bridge',
      trafficDirection: 'Encapsulated Layer-2 broadcast and unicast frame bridging',
      highAvailability: 'Active/Standby gateway appliance pair with automated keepalive heartbeat.',
      sizingAndConstraints: 'Supports multiple stretched VLANs per appliance; up to 10 Gbps line-rate forwarding over ExpressRoute.',
      portsTable: [
        { protocol: 'UDP', port: '4789', source: 'On-Prem L2 Gateway', destination: 'NC2 L2 Gateway', purpose: 'VXLAN encapsulated Layer-2 frame tunnel' }
      ],
      troubleshootingCli: [
        { command: 'flow-l2-cli tunnel status', context: 'Inspect status of stretched Layer 2 subnet gateway bridge', expectedOutput: 'Tunnel: UP, Stretched VLANs: [100, 101, 102], Packet Loss: 0%' }
      ],
      packetFlowSummary: 'Non-migrated VM on-prem communicates with migrated VM on Azure -> frames encapsulated in VXLAN -> decapsulated on NC2 -> delivered without changing IP addresses.'
    }
  ],

  // NC2 Design 3: Distributed Storage Fabric (DSF), Resiliency & Multi-Region BCDR
  'nc2-design-3': [
    {
      id: 'nc2-3-dsf-pool',
      name: 'Distributed Storage Fabric (DSF) Unified Datastore',
      category: 'Storage Fabric',
      badge: 'DSF Global Storage',
      xPercent: 24,
      yPercent: 48,
      shortDescription: 'Enterprise software-defined hyperconverged storage pooling all physical Azure bare-metal NVMe SSDs.',
      fullDescription: 'Nutanix DSF aggregates physical NVMe solid-state storage across all cluster nodes into a single, shared, fault-tolerant storage pool. All virtual disks, snapshots, and containers draw from this elastic namespace, featuring sub-millisecond read/write latency and automatic load balancing across all node controllers.',
      role: 'Global Hyperconverged Storage Fabric',
      trafficDirection: 'Cluster-wide distributed storage block I/O',
      highAvailability: 'Continuous self-healing; surviving nodes automatically rebuild degraded data blocks without user intervention.',
      sizingAndConstraints: 'Delivers up to millions of aggregate IOPS across enterprise AN64 / AN100 bare-metal clusters.',
      portsTable: [
        { protocol: 'TCP', port: '2020', source: 'CVM Stargate', destination: 'CVM Stargate', purpose: 'Block-level replication and storage pooling' }
      ],
      troubleshootingCli: [
        { command: 'ncli container list', context: 'List active storage containers, usable capacity, and storage efficiency', expectedOutput: 'Container: default-storage-pool, Free Space: 68.4 TB, Dedup: Enabled' },
        { command: 'curator_cli get_task_status', context: 'Inspect background background storage optimization tasks', expectedOutput: 'Curator: Idle, Disk Map Rebalance: Complete' }
      ],
      packetFlowSummary: 'VM issues storage write -> committed immediately to local NVMe flash -> mirrored synchronously across cluster before acknowledging guest OS.'
    },
    {
      id: 'nc2-3-rf2-rf3',
      name: 'Replication Factor 2 (RF2) & Replication Factor 3 (RF3) Failure Domains',
      category: 'Storage Fabric',
      badge: 'RF2 / RF3 Resiliency',
      xPercent: 42,
      yPercent: 28,
      shortDescription: 'Configurable data redundancy policies tolerating one (RF2) or two (RF3) simultaneous physical node outages.',
      fullDescription: 'RF2 writes 2 independent copies of every data block across separate physical nodes; RF3 writes 3 copies across 3 distinct bare-metal nodes. With RF3 enabled, an enterprise NC2 cluster can withstand two simultaneous physical server failures or Azure rack maintenance events with zero downtime and zero data loss.',
      role: 'Storage Fault-Tolerance & Failure Domain Engine',
      trafficDirection: 'Synchronous write mirroring across physical failure domains',
      highAvailability: 'Guarantees continuous read/write accessibility during multiple simultaneous node crashes.',
      sizingAndConstraints: 'RF2 requires minimum 3 nodes; RF3 requires minimum 5 nodes in the cluster.',
      portsTable: [
        { protocol: 'TCP', port: '2020', source: 'Local CVM', destination: 'Replica CVM Nodes', purpose: 'Synchronous multi-node block commit' }
      ],
      troubleshootingCli: [
        { command: 'ncli cluster get-redundancy-state', context: 'Inspect current cluster data replication factor and tolerance state', expectedOutput: 'Desired Redundancy: 3, Current Redundancy: 3, Status: OK' }
      ],
      packetFlowSummary: 'Write request arrives -> CVM calculates striping hash -> writes Block A to Node 1, Block B to Node 2, Block C to Node 3 simultaneously.'
    },
    {
      id: 'nc2-3-dedup-ecx',
      name: 'Inline Deduplication, Compression & EC-X Erasure Coding',
      category: 'Storage Fabric',
      badge: 'Inline EC-X Efficiency',
      xPercent: 40,
      yPercent: 62,
      shortDescription: 'Hardware-assisted inline storage reduction delivering 2.5x to 4x data capacity savings on Azure bare-metal storage.',
      fullDescription: 'Combines real-time LZ4 compression, SHA-256 fingerprint deduplication, and Post-Process Erasure Coding (EC-X). Cold data strips across nodes using parity calculations (e.g. 4:1 or 4:2), reclaiming up to 75% of storage capacity while maintaining full RF3 resiliency standards.',
      role: 'Storage Capacity Optimization & Reduction',
      trafficDirection: 'Inline I/O processing and background batch parity generation',
      highAvailability: 'Full data recovery from parity blocks if physical nodes experience drive failure.',
      sizingAndConstraints: 'Zero penalty on transactional write latency; offloaded to idle CPU cores.',
      portsTable: [
        { protocol: 'Internal', port: 'Memory', source: 'Stargate Daemon', destination: 'RAM Cache', purpose: 'High-speed fingerprint hash lookup table' }
      ],
      troubleshootingCli: [
        { command: 'ncli container get name=<name>', context: 'Check overall compression and deduplication ratios', expectedOutput: 'Savings: Compression: 1.8x, Deduplication: 1.4x, EC-X: 1.3x (Overall: 3.2x)' }
      ],
      packetFlowSummary: 'Ingress data chunked -> SHA-256 hash computed -> matching fingerprints referenced without duplicate writes -> cold blocks coded with EC-X parity.'
    },
    {
      id: 'nc2-3-leap-dr',
      name: 'Nutanix Leap Disaster Recovery Runbooks & Orchestration',
      category: 'Appliance',
      badge: 'Leap DR Runbooks',
      xPercent: 54,
      yPercent: 82,
      shortDescription: 'Policy-driven business continuity orchestrating automated cross-region and hybrid DR failover plans.',
      fullDescription: 'Nutanix Leap centralizes Protection Policies and Recovery Plans. Features granular RPO configurations (down to 1 minute or near-zero with synchronous replication), boot ordering with multi-tier execution groups, automated IP remapping, and 1-click non-disruptive DR test bubble sandbox validation.',
      role: 'Disaster Recovery Runbook Orchestration Engine',
      trafficDirection: 'Cross-region snapshot replication and failover orchestration',
      highAvailability: 'Bi-directional replication supporting automated failover and 1-click planned reprotect.',
      sizingAndConstraints: 'Orchestrates failover across Azure regions (e.g. East US to West US) or on-prem to Azure NC2.',
      portsTable: [
        { protocol: 'TCP', port: '9440', source: 'Primary Leap Engine', destination: 'Recovery Site Prism Central', purpose: 'DR replication sync and runbook execution' }
      ],
      troubleshootingCli: [
        { command: 'leap-cli recovery-plan test --plan-id <id>', context: 'Execute non-disruptive DR test run in isolated Azure test bubble', expectedOutput: 'Execution: Success, VMs Powered On: 48/48, Test Bubble Verified' }
      ],
      packetFlowSummary: 'Protection policy triggers -> snapshot captured -> replicated to secondary Azure region -> Leap executes automated power-on sequencing upon failover.'
    },
    {
      id: 'nc2-3-blob-tiering',
      name: 'Azure Blob Storage Snapshot Tiering & Cold Archival',
      category: 'Storage Fabric',
      badge: 'Azure Blob Cold Tier',
      xPercent: 88,
      yPercent: 80,
      shortDescription: 'Automated lifecycle management moving stale snapshots and historical backups to cost-efficient Azure Blob Storage.',
      fullDescription: 'Integrates native Azure Blob storage accounts as external storage targets. Historical snapshots older than designated retention thresholds are transparently archived from high-cost local NVMe drives into Azure Cool or Cold Blob storage, cutting long-term retention storage costs by up to 80%.',
      role: 'Cost-Optimized Cloud Object Storage Tier',
      trafficDirection: 'Outbound snapshot archival over Azure internal backbone',
      highAvailability: 'Geo-redundant storage (GRS) replication across multiple Azure regions.',
      sizingAndConstraints: 'Virtually unlimited scale-out capacity; sub-second pointer retrieval when restoring historical snapshots.',
      portsTable: [
        { protocol: 'HTTPS', port: '443', source: 'CVM Storage Pool', destination: 'Azure Blob Storage Endpoint', purpose: 'Secure REST API object streaming' }
      ],
      troubleshootingCli: [
        { command: 'az storage account show -g <rg> -n <storage-account> --query "primaryEndpoints.blob"', context: 'Verify connectivity to Azure Blob archive tier', expectedOutput: 'https://nc2archive01.blob.core.windows.net/' }
      ],
      packetFlowSummary: 'Retention scheduler flags snapshot -> CVM deduplicates object -> streams encrypted blocks over Azure private backbone into Azure Blob container.'
    }
  ]
};

// Map each image filename key to its corresponding design key
const IMAGE_TO_DESIGN_KEY: Record<string, string> = {
  'avs_architecture_showcase': 'avs-design-1',
  'avs_anf_storage': 'avs-design-2',
  'avs_stretched_cluster': 'avs-design-3',
  'gcve_architecture_showcase': 'gcve-design-1',
  'gcve_gcnv_storage': 'gcve-design-2',
  'gcve_bigquery_ai': 'gcve-design-3',
  'vmc_aws_migration': 'vmc-design-1',
  'vmc_fsx_ontap': 'vmc-design-2',
  'vmc_tgw_transit': 'vmc-design-3',
  'nsx_microsegmentation': 'nsx-design-1',
  'nsx_tier0_tier1': 'nsx-design-2',
  'nsx_avi_vantage': 'nsx-design-3',
  'hcx_architecture_showcase': 'hcx-design-1',
  'hcx_mon_traffic': 'hcx-design-2',
  'hcx_rav_live': 'hcx-design-3',
  'srm_architecture_showcase': 'srm-design-1',
  'srm_sra_array': 'srm-design-2',
  'srm_test_bubble': 'srm-design-3',
  'aria_flow_discovery': 'aria-design-1',
  'aria_network_microseg': 'aria-design-2',
  'aria_dfw_microseg': 'aria-design-3',
  'nutanix_nc2_azure_architecture': 'nc2-design-1',
  'nutanix_move_migration': 'nc2-design-2',
  'nutanix_dsf_storage_bcdr': 'nc2-design-3'
};

// Helper function to resolve hotspots for any specific design or image
export function getHotspotsForDesign(designId?: string, imageUrl?: string): DiagramHotspot[] {
  // 1. First priority: direct match on designId
  if (designId && DIAGRAM_HOTSPOTS_COLLECTION[designId]) {
    return DIAGRAM_HOTSPOTS_COLLECTION[designId];
  }

  // 2. Second priority: image URL matching via keyword
  if (imageUrl) {
    for (const [key, mappedDesignId] of Object.entries(IMAGE_TO_DESIGN_KEY)) {
      if (imageUrl.includes(key)) {
        return DIAGRAM_HOTSPOTS_COLLECTION[mappedDesignId] || [];
      }
    }
  }

  // 3. Fallback: if designId is something like 'avs-1' or 'hcx-2'
  if (designId) {
    const normalized = designId.replace('-1', '-design-1')
      .replace('-2', '-design-2')
      .replace('-3', '-design-3');
    if (DIAGRAM_HOTSPOTS_COLLECTION[normalized]) {
      return DIAGRAM_HOTSPOTS_COLLECTION[normalized];
    }
  }

  return [];
}

export function getHotspotsForImage(imageUrl: string): DiagramHotspot[] {
  return getHotspotsForDesign(undefined, imageUrl);
}

export function getAllHotspots(): DiagramHotspot[] {
  const result: DiagramHotspot[] = [];
  Object.values(DIAGRAM_HOTSPOTS_COLLECTION).forEach(list => {
    list.forEach(item => {
      if (!result.some(r => r.id === item.id)) {
        result.push(item);
      }
    });
  });
  return result;
}
