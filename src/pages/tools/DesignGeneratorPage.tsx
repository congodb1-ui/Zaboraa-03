import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  HardDrive,
  Cpu,
  ShieldCheck,
  Download,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  FolderGit2,
  RefreshCw,
  Server,
  Network,
  Shield,
  Lock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Printer,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { useCustomization } from '../../context/CustomizationContext';
import { GOOGLE_DRIVE_CONFIG } from '../../data/mediaAssets';

interface VlanSubsegment {
  vlanId: number;
  subnetCidr: string;
  environment: 'Dev' | 'Staging' | 'Pre-Prod' | 'Prod';
}

export const DesignGeneratorPage: React.FC = () => {
  const { setIsBriefingModalOpen } = useCustomization();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Wizard Metadata
  const [customerName, setCustomerName] = useState<string>('Global Financial Enterprises');
  const [architectName, setArchitectName] = useState<string>('Wasim Sayyed');
  const [projectDate, setProjectDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cloudPlatform, setCloudPlatform] = useState<'Azure VMware Solution' | 'Google Cloud VMware Engine' | 'VMware Cloud on AWS'>('Azure VMware Solution');

  // 2. On-Premises Infrastructure
  const [vCenterCount, setVCenterCount] = useState<number>(2);
  const [esxiHostCount, setEsxiHostCount] = useState<number>(24);
  const [clusterCount, setClusterCount] = useState<number>(4);
  const [vdsCount, setVdsCount] = useState<number>(2);
  const [totalVMCount, setTotalVMCount] = useState<number>(380);
  const [environments, setEnvironments] = useState<string[]>(['Dev', 'Staging', 'Prod']);
  const [subsegments, setSubsegments] = useState<VlanSubsegment[]>([
    { vlanId: 10, subnetCidr: '10.10.10.0/24', environment: 'Prod' },
    { vlanId: 20, subnetCidr: '10.20.10.0/24', environment: 'Prod' },
    { vlanId: 30, subnetCidr: '10.30.10.0/24', environment: 'Prod' },
    { vlanId: 40, subnetCidr: '10.40.10.0/24', environment: 'Dev' },
    { vlanId: 100, subnetCidr: '10.100.10.0/24', environment: 'Prod' }
  ]);

  // 3. Network & Security Settings
  const [connectivity, setConnectivity] = useState<'Hybrid (VPN + ExpressRoute / DirectConnect)' | 'VPN Only' | 'Direct Circuits with FastPath / Global Reach'>('Hybrid (VPN + ExpressRoute / DirectConnect)');
  const [landingZone, setLandingZone] = useState<'Hub-Spoke VNet / VPC' | 'Dedicated Transit Hub VNet' | 'Azure Virtual WAN / AWS TGW / GCP NCC'>('Hub-Spoke VNet / VPC');
  const [nvaFirewall, setNvaFirewall] = useState<'Palo Alto Networks VM-Series' | 'Azure Firewall Premium / Native' | 'Fortinet FortiGate-VM' | 'Check Point CloudGuard' | 'Cisco Secure Firewall'>('Palo Alto Networks VM-Series');
  const [wafSolution, setWafSolution] = useState<'Azure WAF on Application Gateway' | 'Cloudflare Magic Transit' | 'AWS WAF' | 'F5 Distributed Cloud WAF'>('Azure WAF on Application Gateway');

  // 4. Hyperscaler SDDC Settings
  const [avsGen, setAvsGen] = useState<'Gen 1' | 'Gen 2'>('Gen 2');
  const [nodeSku, setNodeSku] = useState<string>('AV36P');
  const [mgmtCidrInput, setMgmtCidrInput] = useState<string>('10.240.0.0/22');
  const [decoupledStorageTB, setDecoupledStorageTB] = useState<number>(120);

  // SVG Zoom
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [showDossierModal, setShowDossierModal] = useState<boolean>(false);
  const [importedNotice, setImportedNotice] = useState<string | null>(null);

  // Hydrate from RVTools or DR Planner or Sizing Tool
  useEffect(() => {
    try {
      const blueprintState = localStorage.getItem('zaboraa_4k_blueprint_state');
      const drExport = localStorage.getItem('zaboraa_dr_export');
      const sizingExport = localStorage.getItem('zaboraa_sizing_export');

      if (blueprintState) {
        const parsed = JSON.parse(blueprintState);
        if (parsed.totalVMs) setTotalVMCount(parsed.totalVMs);
        if (parsed.customerName) setCustomerName(parsed.customerName);
        if (parsed.totalStorageTB) setDecoupledStorageTB(parsed.decoupledStorageTB || Math.round(parsed.totalStorageTB * 0.7));
        if (parsed.targetCloud) {
          if (parsed.targetCloud.includes('AWS')) setCloudPlatform('VMware Cloud on AWS');
          else if (parsed.targetCloud.includes('Google')) setCloudPlatform('Google Cloud VMware Engine');
          else setCloudPlatform('Azure VMware Solution');
        }
        if (parsed.nodeSku) {
          const cleanSku = parsed.nodeSku.replace(/^AVS-/, '').replace(/^VMC-/, '').replace(/^GCVE-/, '');
          setNodeSku(cleanSku);
        }
        if (parsed.vlans && Array.isArray(parsed.vlans) && parsed.vlans.length > 0) {
          setSubsegments(parsed.vlans.slice(0, 6).map((v: any, i: number) => ({
            vlanId: v.vlanId || (i + 1) * 10,
            subnetCidr: `10.${v.vlanId || (i + 1) * 10}.10.0/24`,
            environment: (v.portGroup?.toLowerCase().includes('dev') ? 'Dev' : v.portGroup?.toLowerCase().includes('stg') ? 'Staging' : 'Prod') as 'Dev' | 'Staging' | 'Prod'
          })));
        }
        setImportedNotice(`Hydrated from RVTools Ingestion: ${parsed.totalVMs} VMs, ${parsed.totalStorageTB} TiB Storage, ${parsed.targetCloud || 'AVS'} (${parsed.nodeSku || 'AV36P'}).`);
      } else if (drExport) {
        const parsed = JSON.parse(drExport);
        if (parsed.vms) setTotalVMCount(parsed.vms);
        if (parsed.storageTB) setDecoupledStorageTB(Math.round(parsed.storageTB * 0.6));
        setImportedNotice(`Hydrated from DR Planner: ${parsed.vms} protected VMs, ${parsed.storageTB} TB footprint, ${parsed.engine} (${parsed.rpoMin}m RPO).`);
      } else if (sizingExport) {
        const parsed = JSON.parse(sizingExport);
        if (parsed.vms) setTotalVMCount(parsed.vms);
        if (parsed.decoupledStorageTB) setDecoupledStorageTB(parsed.decoupledStorageTB);
        setImportedNotice(`Hydrated from Sizing Estimator: ${parsed.vms} VMs, ${parsed.decoupledStorageTB} TB external storage.`);
      }
    } catch {}
  }, []);

  // Update Node SKU options when cloud platform changes
  useEffect(() => {
    if (cloudPlatform === 'Azure VMware Solution') {
      setNodeSku('AV36P');
    } else if (cloudPlatform === 'VMware Cloud on AWS') {
      setNodeSku('i4i.metal');
    } else {
      setNodeSku('ve1-standard-72');
    }
  }, [cloudPlatform]);

  const effectiveMgmtCidr = mgmtCidrInput.trim() || '10.240.0.0/22';
  const calculatedCloudNodes = Math.max(3, Math.ceil(totalVMCount / (nodeSku.includes('64') || nodeSku.includes('i4i') ? 70 : 45)));

  // 4K Canvas Drawing Engine (3840x2160)
  const draw4KCanvas = (targetCanvas: HTMLCanvasElement) => {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    const width = 3840;
    const height = 2160;
    targetCanvas.width = width;
    targetCanvas.height = height;

    // 1. Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#020617');
    bgGrad.addColorStop(0.5, '#090d16');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid overlay
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Executive Header Banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(80, 80, width - 160, 200);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 80, width - 160, 200);

    // Header Content
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${customerName} — Production Hybrid Architecture Blueprint`, 130, 160);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '28px "JetBrains Mono", monospace';
    ctx.fillText(
      `TARGET CLOUD: ${cloudPlatform.toUpperCase()} (${nodeSku}) · ARCHITECT: ${architectName} · DATE: ${projectDate} · MANAGEMENT CIDR: ${effectiveMgmtCidr}`,
      130,
      225
    );

    // 3. Panel 1: On-Premises Datacenter (Left)
    const p1X = 80;
    const p1Y = 330;
    const pWidth = 1100;
    const pHeight = 1700;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(p1X, p1Y, pWidth, pHeight);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(p1X, p1Y, pWidth, pHeight);

    // Panel 1 Title
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('01. ON-PREMISES ENTERPRISE DATACENTER', p1X + 40, p1Y + 70);

    // Box 1.1: Core vSphere Compute
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(p1X + 40, p1Y + 120, pWidth - 80, 360);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(p1X + 40, p1Y + 120, pWidth - 80, 360);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('VMware vCenter Server (vSphere 7.x / 8.x)', p1X + 70, p1Y + 180);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillText(`• ${vCenterCount} vCenter Server Appliance(s) (VCSA)`, p1X + 70, p1Y + 240);
    ctx.fillText(`• ${clusterCount} Production Clusters (${esxiHostCount} Bare-Metal ESXi Hosts)`, p1X + 70, p1Y + 290);
    ctx.fillText(`• ${totalVMCount} Virtual Machines Across ${environments.join(', ')}`, p1X + 70, p1Y + 340);
    ctx.fillText(`• ${vdsCount} Virtual Distributed Switches (VDS)`, p1X + 70, p1Y + 390);

    // Box 1.2: Storage & SAN
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(p1X + 40, p1Y + 520, pWidth - 80, 320);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(p1X + 40, p1Y + 520, pWidth - 80, 320);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('On-Premises SAN / NAS Storage Tier', p1X + 70, p1Y + 580);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillText('• Fibre Channel / iSCSI Enterprise Array Tier', p1X + 70, p1Y + 640);
    ctx.fillText('• NFS / VMFS Shared Clustered Datastores', p1X + 70, p1Y + 700);
    ctx.fillText(`• Subsegments / VLANs: ${subsegments.map(s => `VLAN ${s.vlanId}`).join(', ')}`, p1X + 70, p1Y + 760);

    // Box 1.3: HCX Connector Appliance Fleet
    ctx.fillStyle = 'rgba(6, 78, 59, 0.7)';
    ctx.fillRect(p1X + 40, p1Y + 880, pWidth - 80, 360);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(p1X + 40, p1Y + 880, pWidth - 80, 360);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('VMware HCX Connector Fleet (Enterprise Mesh)', p1X + 70, p1Y + 940);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillText('• HCX Cloud Manager Interconnect (IX)', p1X + 70, p1Y + 1000);
    ctx.fillText('• HCX Network Extension (NE) Fleet (L2 Broadcast)', p1X + 70, p1Y + 1050);
    ctx.fillText('• HCX WAN Optimization (WO) Engine', p1X + 70, p1Y + 1100);
    ctx.fillText('• Mobility Optimized Networking (MON) Active', p1X + 70, p1Y + 1150);

    // 4. Panel 2: Hybrid Transit & Edge Security (Center)
    const p2X = 1240;
    const p2Y = 330;
    const p2Width = 1100;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(p2X, p2Y, p2Width, pHeight);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(p2X, p2Y, p2Width, pHeight);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('02. HYBRID TRANSIT & SECURITY EDGE', p2X + 40, p2Y + 70);

    // Box 2.1: Physical Interconnect
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(p2X + 40, p2Y + 120, p2Width - 80, 320);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(p2X + 40, p2Y + 120, p2Width - 80, 320);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Cloud Interconnect & Express Peering', p2X + 70, p2Y + 180);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillText(`• ${connectivity}`, p2X + 70, p2Y + 240);
    ctx.fillText('• Dual Redundant 10 Gbps BGP Cross-Connects', p2X + 70, p2Y + 290);
    ctx.fillText('• Ultra-Low Latency Direct Peering (<2ms)', p2X + 70, p2Y + 340);

    // Box 2.2: Transit Hub Architecture
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(p2X + 40, p2Y + 480, p2Width - 80, 360);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(p2X + 40, p2Y + 480, p2Width - 80, 360);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Landing Zone: ${landingZone}`, p2X + 70, p2Y + 540);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillText('• ExpressRoute Gateway / DirectConnect VGW', p2X + 70, p2Y + 600);
    ctx.fillText('• Transitive Routing & Route Server Peering', p2X + 70, p2Y + 650);
    ctx.fillText('• FastPath Acceleration Enabled', p2X + 70, p2Y + 700);

    // Box 2.3: Next-Gen Firewall (NVA) & WAF
    ctx.fillStyle = 'rgba(88, 28, 135, 0.7)';
    ctx.fillRect(p2X + 40, p2Y + 880, p2Width - 80, 360);
    ctx.strokeStyle = '#a855f7';
    ctx.strokeRect(p2X + 40, p2Y + 880, p2Width - 80, 360);
    ctx.fillStyle = '#d8b4fe';
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`NVA Firewall: ${nvaFirewall}`, p2X + 70, p2Y + 940);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillText(`• Web Application Firewall: ${wafSolution}`, p2X + 70, p2Y + 1000);
    ctx.fillText('• Deep Packet Inspection (DPI) & IPS/IDS', p2X + 70, p2Y + 1050);
    ctx.fillText('• Egress Internet Breakout & Zero-Trust Inspection', p2X + 70, p2Y + 1100);

    // 5. Panel 3: Cloud SDDC Core (Right)
    const p3X = 2400;
    const p3Y = 330;
    const p3Width = 1360;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(p3X, p3Y, p3Width, pHeight);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(p3X, p3Y, p3Width, pHeight);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`03. ${cloudPlatform.toUpperCase()} SDDC CORE`, p3X + 40, p3Y + 70);

    // Box 3.1: Bare-Metal SDDC Cluster
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(p3X + 40, p3Y + 120, p3Width - 80, 360);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(p3X + 40, p3Y + 120, p3Width - 80, 360);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Cluster Architecture: ${calculatedCloudNodes} Hosts (${nodeSku})`, p3X + 70, p3Y + 180);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillText(`• Hardware Generation: ${avsGen} Architecture`, p3X + 70, p3Y + 240);
    ctx.fillText(`• Management Network CIDR: ${effectiveMgmtCidr}`, p3X + 70, p3Y + 290);
    ctx.fillText('• vCenter Server + vSAN Enterprise Array', p3X + 70, p3Y + 340);
    ctx.fillText(`• Sized for ${totalVMCount} Workloads with N+1 High Availability`, p3X + 70, p3Y + 390);

    // Box 3.2: NSX-T Software Defined Networking
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.fillRect(p3X + 40, p3Y + 520, p3Width - 80, 340);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(p3X + 40, p3Y + 520, p3Width - 80, 340);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NSX-T Multi-Tier Routing & Microsegmentation', p3X + 70, p3Y + 580);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillText('• Tier-0 Active-Active Gateway with ECMP Peering', p3X + 70, p3Y + 640);
    ctx.fillText(`• Segregated Tier-1 Gateways (${environments.map(e => `T1-${e}`).join(', ')})`, p3X + 70, p3Y + 690);
    ctx.fillText('• Distributed Firewall (DFW) Microsegmentation Active', p3X + 70, p3Y + 740);

    // Box 3.3: External Decoupled Storage Tier
    ctx.fillStyle = 'rgba(12, 74, 110, 0.7)';
    ctx.fillRect(p3X + 40, p3Y + 880, p3Width - 80, 360);
    ctx.strokeStyle = '#0284c7';
    ctx.strokeRect(p3X + 40, p3Y + 880, p3Width - 80, 360);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('External Decoupled Storage Tier (NFS Datastores)', p3X + 70, p3Y + 940);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillText(`• Capacity: ${decoupledStorageTB} TB Offloaded from vSAN Sprawl`, p3X + 70, p3Y + 1000);
    ctx.fillText(
      `• Platform: ${cloudPlatform === 'Azure VMware Solution' ? 'Azure NetApp Files (ANF Standard/Premium)' : cloudPlatform === 'VMware Cloud on AWS' ? 'Amazon FSx for NetApp ONTAP' : 'Google Cloud NetApp Volumes'}`,
      p3X + 70,
      1050
    );
    ctx.fillText('• High-Throughput Dedicated NFS Datastore Mounts', p3X + 70, 1100);

    // 6. Connectors (Arrow lines across panels)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 6;
    ctx.setLineDash([16, 8]);

    // Line 1: On-Prem to Edge
    ctx.beginPath();
    ctx.moveTo(p1X + pWidth, p1Y + 1040);
    ctx.lineTo(p2X, p2Y + 280);
    ctx.stroke();

    // Line 2: Edge to SDDC
    ctx.beginPath();
    ctx.moveTo(p2X + p2Width, p2Y + 660);
    ctx.lineTo(p3X, p3Y + 660);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Export 4K PNG / JPG
  const handleExport4K = (format: 'png' | 'jpeg') => {
    const canvas = document.createElement('canvas');
    draw4KCanvas(canvas);
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mime, 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${customerName.replace(/\s+/g, '_')}_4K_Architecture_Blueprint.${format === 'png' ? 'png' : 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Link to="/tools" className="hover:text-cyan-400 transition-colors">Engineering Workbench</Link>
          <span>/</span>
          <span className="text-cyan-300">4K Ultra-HD Architecture Diagram Generator</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Ultra-High-Resolution 4K Architecture Diagram Generator
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Capture production infrastructure metadata and render high-DPI vector topology diagrams. Outputs ultra-sharp 4K images (3840x2160), executive PDF dossiers, and multi-cloud deliverables.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport4K('png')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download 4K PNG (3840x2160)</span>
            </button>
            <button
              onClick={() => setShowDossierModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Executive Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {importedNotice && (
        <div className="p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-300 flex items-center justify-between">
          <span className="flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            {importedNotice}
          </span>
          <button
            onClick={() => setImportedNotice(null)}
            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Interactive Infrastructure Capture Wizard (4 Columns / Form Sections) */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>Infrastructure Parameters & Topology Configuration Wizard</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          {/* Section 1: Customer & Cloud */}
          <div className="space-y-3">
            <div className="font-mono text-cyan-400 font-bold uppercase text-[10px]">01. Metadata & Cloud</div>
            <div className="space-y-1">
              <label className="text-slate-300">Customer Organization Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300">Lead Principal Architect</label>
              <input
                type="text"
                value={architectName}
                onChange={e => setArchitectName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300">Target Hyperscaler Platform</label>
              <select
                value={cloudPlatform}
                onChange={e => setCloudPlatform(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs font-bold"
              >
                <option value="Azure VMware Solution">Azure VMware Solution (AVS)</option>
                <option value="VMware Cloud on AWS">VMware Cloud on AWS (VMC)</option>
                <option value="Google Cloud VMware Engine">Google Cloud VMware Engine (GCVE)</option>
              </select>
            </div>
          </div>

          {/* Section 2: On-Premises Inventory */}
          <div className="space-y-3">
            <div className="font-mono text-cyan-400 font-bold uppercase text-[10px]">02. On-Premises SDDC</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-300">vCenter Count</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={vCenterCount}
                  onChange={e => setVCenterCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300">ESXi Hosts</label>
                <input
                  type="number"
                  min="4"
                  max="200"
                  value={esxiHostCount}
                  onChange={e => setEsxiHostCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-300">Cluster Count</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={clusterCount}
                  onChange={e => setClusterCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300">Total VMs</label>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={totalVMCount}
                  onChange={e => setTotalVMCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs font-mono font-bold text-cyan-300"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300">Environments</label>
              <div className="flex gap-2 text-[10px]">
                {['Dev', 'Staging', 'Prod'].map(env => (
                  <button
                    key={env}
                    onClick={() => {
                      setEnvironments(prev =>
                        prev.includes(env) ? prev.filter(e => e !== env) : [...prev, env]
                      );
                    }}
                    className={`px-2 py-1 rounded border font-mono cursor-pointer ${
                      environments.includes(env)
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Network & Security */}
          <div className="space-y-3">
            <div className="font-mono text-cyan-400 font-bold uppercase text-[10px]">03. Network & Security Edge</div>
            <div className="space-y-1">
              <label className="text-slate-300">Physical Connectivity</label>
              <select
                value={connectivity}
                onChange={e => setConnectivity(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-[11px]"
              >
                <option value="Hybrid (VPN + ExpressRoute / DirectConnect)">Hybrid (VPN + ExpressRoute / DirectConnect)</option>
                <option value="Direct Circuits with FastPath / Global Reach">Direct Circuits (FastPath / Global Reach)</option>
                <option value="VPN Only">IPsec VPN Only</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300">NVA Firewall Architecture</label>
              <select
                value={nvaFirewall}
                onChange={e => setNvaFirewall(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-[11px]"
              >
                <option value="Palo Alto Networks VM-Series">Palo Alto Networks VM-Series</option>
                <option value="Azure Firewall Premium / Native">Azure Firewall Premium / Native</option>
                <option value="Fortinet FortiGate-VM">Fortinet FortiGate-VM</option>
                <option value="Check Point CloudGuard">Check Point CloudGuard</option>
                <option value="Cisco Secure Firewall">Cisco Secure Firewall</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-slate-300">WAF Solution</label>
              <select
                value={wafSolution}
                onChange={e => setWafSolution(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-[11px]"
              >
                <option value="Azure WAF on Application Gateway">Azure WAF on App Gateway</option>
                <option value="Cloudflare Magic Transit">Cloudflare Magic Transit</option>
                <option value="AWS WAF">AWS WAF</option>
                <option value="F5 Distributed Cloud WAF">F5 Distributed Cloud WAF</option>
              </select>
            </div>
          </div>

          {/* Section 4: Hyperscaler SDDC Settings */}
          <div className="space-y-3">
            <div className="font-mono text-cyan-400 font-bold uppercase text-[10px]">04. SDDC SKU & IPAM</div>
            <div className="space-y-1">
              <label className="text-slate-300">Bare-Metal Node SKU</label>
              <select
                value={nodeSku}
                onChange={e => setNodeSku(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-[11px] font-mono font-bold text-cyan-300"
              >
                {cloudPlatform === 'Azure VMware Solution' && (
                  <>
                    <option value="AV36P">AV36P (36 cores, 576GB RAM)</option>
                    <option value="AV64">AV64 (64 cores, 1024GB RAM)</option>
                    <option value="AV48">AV48 (48 cores, 768GB RAM)</option>
                  </>
                )}
                {cloudPlatform === 'VMware Cloud on AWS' && (
                  <>
                    <option value="i4i.metal">i4i.metal (64 cores, 1024GB RAM)</option>
                    <option value="i3en.metal">i3en.metal (96 cores, 768GB RAM)</option>
                  </>
                )}
                {cloudPlatform === 'Google Cloud VMware Engine' && (
                  <>
                    <option value="ve1-standard-72">ve1-standard-72 (72 cores, 768GB RAM)</option>
                    <option value="ve2-standard-128">ve2-standard-128 (128 cores, 2048GB RAM)</option>
                  </>
                )}
              </select>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-slate-300">Management IP CIDR</label>
                <span className="text-[10px] text-cyan-400 font-mono">/22 Required</span>
              </div>
              <input
                type="text"
                placeholder="10.240.0.0/22"
                value={mgmtCidrInput}
                onChange={e => setMgmtCidrInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300">Decoupled Storage (TB)</label>
              <input
                type="number"
                min="0"
                max="800"
                value={decoupledStorageTB}
                onChange={e => setDecoupledStorageTB(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Vector Graphics Topology Viewport (Dual Mode: Interactive SVG + 4K Export Toolbar) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase">Dual-Mode Vector Canvas</span>
            <h3 className="text-lg font-bold text-white">4K Multi-Tier Topology Viewport</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setZoomScale(prev => Math.max(0.6, prev - 0.1))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono text-cyan-300">{Math.round(zoomScale * 100)}%</span>
              <button
                onClick={() => setZoomScale(prev => Math.min(1.8, prev + 0.1))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomScale(1.0)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer text-[10px] font-mono"
                title="Reset Zoom"
              >
                100%
              </button>
            </div>
            <button
              onClick={() => handleExport4K('png')}
              className="px-3 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>4K PNG</span>
            </button>
          </div>
        </div>

        {/* Interactive SVG Viewport */}
        <div className="overflow-x-auto overflow-y-hidden border border-slate-800 rounded-xl bg-slate-950 p-4">
          <div
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top left',
              transition: 'transform 0.15s ease-out',
              width: '1280px',
              height: '720px'
            }}
            className="relative bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl select-none"
          >
            {/* SVG Vector Drawing */}
            <svg viewBox="0 0 1280 720" className="w-full h-full">
              {/* Grid Background */}
              <defs>
                <pattern id="diagGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="1280" height="720" fill="url(#diagGrid)" />

              {/* Header Box */}
              <rect x="30" y="25" width="1220" height="65" rx="8" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
              <text x="50" y="52" fill="#ffffff" fontSize="16" fontWeight="bold" fontFamily="Plus Jakarta Sans">
                {customerName} — {cloudPlatform} Architecture Blueprint
              </text>
              <text x="50" y="74" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono">
                ARCHITECT: {architectName} · DATE: {projectDate} · NODE SKU: {nodeSku} ({calculatedCloudNodes} NODES) · MGMT CIDR: {effectiveMgmtCidr}
              </text>

              {/* Panel 1: On-Premises Datacenter (Left) */}
              <rect x="30" y="110" width="370" height="570" rx="10" fill="#0b1120" stroke="#334155" strokeWidth="1" />
              <text x="50" y="140" fill="#06b6d4" fontSize="13" fontWeight="bold" fontFamily="Plus Jakarta Sans">
                01. ON-PREMISES DATACENTER
              </text>

              {/* On-Prem Box 1: vSphere Compute */}
              <rect x="50" y="160" width="330" height="150" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="65" y="185" fill="#ffffff" fontSize="12" fontWeight="bold">VMware vCenter Server (VCSA)</text>
              <text x="65" y="210" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• {vCenterCount} vCenter Instance(s)</text>
              <text x="65" y="230" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• {clusterCount} Clusters · {esxiHostCount} ESXi Hosts</text>
              <text x="65" y="250" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• {totalVMCount} Virtual Machines</text>
              <text x="65" y="270" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• {vdsCount} Virtual Distributed Switches</text>

              {/* On-Prem Box 2: SAN Storage */}
              <rect x="50" y="325" width="330" height="130" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="65" y="350" fill="#ffffff" fontSize="12" fontWeight="bold">SAN / NAS Storage Tier</text>
              <text x="65" y="375" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• Fibre Channel / iSCSI Clustered Arrays</text>
              <text x="65" y="395" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• Stretched VLANs: {subsegments.map(s => s.vlanId).join(', ')}</text>
              <text x="65" y="415" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• Environments: {environments.join(', ')}</text>

              {/* On-Prem Box 3: HCX Connector */}
              <rect x="50" y="470" width="330" height="180" rx="6" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
              <text x="65" y="495" fill="#34d399" fontSize="12" fontWeight="bold">VMware HCX Connector Fleet</text>
              <text x="65" y="520" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">• HCX Interconnect (IX) Service Engine</text>
              <text x="65" y="540" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">• HCX Network Extension (NE) L2 Stretch</text>
              <text x="65" y="560" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">• HCX WAN Optimization (WO)</text>
              <text x="65" y="580" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">• Mobility Optimized Networking (MON)</text>

              {/* Panel 2: Hybrid Transit & Edge Security (Center) */}
              <rect x="430" y="110" width="370" height="570" rx="10" fill="#0b1120" stroke="#334155" strokeWidth="1" />
              <text x="450" y="140" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="Plus Jakarta Sans">
                02. HYBRID TRANSIT & EDGE
              </text>

              {/* Center Box 1: Interconnect */}
              <rect x="450" y="160" width="330" height="130" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="465" y="185" fill="#ffffff" fontSize="12" fontWeight="bold">Cloud Interconnect & Peering</text>
              <text x="465" y="210" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• {connectivity}</text>
              <text x="465" y="230" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• Dual Redundant 10G Circuits</text>
              <text x="465" y="250" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• BGP Dynamic Route Peering</text>

              {/* Center Box 2: Landing Zone */}
              <rect x="450" y="305" width="330" height="150" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="465" y="330" fill="#ffffff" fontSize="12" fontWeight="bold">Landing Zone Architecture</text>
              <text x="465" y="355" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• {landingZone}</text>
              <text x="465" y="375" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• FastPath Gateway Acceleration</text>
              <text x="465" y="395" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• Route Server Peering Active</text>

              {/* Center Box 3: NVA Firewall & WAF */}
              <rect x="450" y="470" width="330" height="180" rx="6" fill="#581c87" stroke="#a855f7" strokeWidth="1" />
              <text x="465" y="495" fill="#d8b4fe" fontSize="12" fontWeight="bold">NVA Firewall: {nvaFirewall.split(' ')[0]}</text>
              <text x="465" y="520" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">• {nvaFirewall}</text>
              <text x="465" y="540" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">• WAF: {wafSolution}</text>
              <text x="465" y="560" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">• Zero-Trust Inspection & IDS/IPS</text>
              <text x="465" y="580" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">• Egress Cloud Breakout Routing</text>

              {/* Panel 3: Cloud SDDC Core (Right) */}
              <rect x="830" y="110" width="420" height="570" rx="10" fill="#0b1120" stroke="#334155" strokeWidth="1" />
              <text x="850" y="140" fill="#10b981" fontSize="13" fontWeight="bold" fontFamily="Plus Jakarta Sans">
                03. {cloudPlatform.toUpperCase()} SDDC CORE
              </text>

              {/* SDDC Box 1: Bare-Metal Hosts */}
              <rect x="850" y="160" width="380" height="150" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="865" y="185" fill="#ffffff" fontSize="12" fontWeight="bold">
                {calculatedCloudNodes} Hosts ({nodeSku}) — {avsGen}
              </text>
              <text x="865" y="210" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• Management CIDR: {effectiveMgmtCidr}</text>
              <text x="865" y="230" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• VMware ESXi Hypervisor + vSAN</text>
              <text x="865" y="250" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• Sized for {totalVMCount} VMs (N+1 HA Buffer)</text>

              {/* SDDC Box 2: NSX-T Core */}
              <rect x="850" y="325" width="380" height="150" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <text x="865" y="350" fill="#ffffff" fontSize="12" fontWeight="bold">NSX-T SDN & Tier-0/Tier-1 Routing</text>
              <text x="865" y="375" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• Tier-0 Active-Active Gateway (ECMP)</text>
              <text x="865" y="395" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• Segregated Tier-1s: {environments.map(e => `T1-${e}`).join(', ')}</text>
              <text x="865" y="415" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">• Distributed Firewall (DFW) Microseg</text>

              {/* SDDC Box 3: Decoupled Storage */}
              <rect x="850" y="490" width="380" height="160" rx="6" fill="#0c4a6e" stroke="#0284c7" strokeWidth="1" />
              <text x="865" y="515" fill="#38bdf8" fontSize="12" fontWeight="bold">
                External Decoupled Storage Tier ({decoupledStorageTB} TB)
              </text>
              <text x="865" y="540" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">
                • {cloudPlatform === 'Azure VMware Solution' ? 'Azure NetApp Files (ANF Standard/Premium)' : cloudPlatform === 'VMware Cloud on AWS' ? 'Amazon FSx for NetApp ONTAP' : 'Google Cloud NetApp Volumes'}
              </text>
              <text x="865" y="560" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">• High-IOPS NFS Datastore Mounts</text>
              <text x="865" y="580" fill="#ffffff" fontSize="10" fontFamily="JetBrains Mono">• Offloads Storage Sprawl from Bare-Metal Hosts</text>

              {/* Interconnect Connecting Arrows */}
              <path d="M 380 540 L 450 220" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="6,4" fill="none" />
              <path d="M 780 380 L 850 380" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="6,4" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* Google Drive Workspace Bridge */}
      <div className="p-5 rounded-xl bg-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/40 shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Google Drive Shared Architecture Repository</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Save your generated 4K topology images and executive dossiers directly to Google Drive folder: <span className="font-mono text-cyan-300 select-all">{GOOGLE_DRIVE_CONFIG.folderId}</span>.
            </div>
          </div>
        </div>
        <a
          href={GOOGLE_DRIVE_CONFIG.folderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shrink-0"
        >
          <span>Open Shared Google Drive</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Executive Dossier Printable Modal */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 sm:p-8 overflow-y-auto flex justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-8 space-y-6 text-slate-200 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">Executive Architecture Deliverable</span>
                <h2 className="text-xl font-bold text-white">{customerName} — Cloud Blueprint Dossier</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>Platform: <span className="font-bold text-white">{cloudPlatform}</span></div>
              <div>Node SKU: <span className="font-bold text-cyan-300">{nodeSku} ({calculatedCloudNodes} Hosts)</span></div>
              <div>Management CIDR: <span className="font-bold text-white">{effectiveMgmtCidr}</span></div>
              <div>Decoupled Storage: <span className="font-bold text-cyan-300">{decoupledStorageTB} TB</span></div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-white uppercase font-mono">Bill of Materials (BOM) Summary:</div>
              <ul className="space-y-1.5 text-slate-300">
                <li>• {calculatedCloudNodes} Bare-Metal Hosts running {cloudPlatform} SDDC</li>
                <li>• {decoupledStorageTB} TB External High-Performance NFS Datastore Tier</li>
                <li>• VMware HCX Enterprise Mobility Fleet (IX, NE, WO)</li>
                <li>• NSX-T Tier-0 Active-Active Gateway with ECMP Peering</li>
                <li>• NVA Next-Gen Firewall: {nvaFirewall}</li>
                <li>• Web Application Firewall: {wafSolution}</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
