# OpenStack

> Source: https://www.pulumi.com/registry/packages/openstack/
> Package: `openstack`
> SST Install: `sst add openstack`

## Overview

The OpenStack provider is used to interact with the many resources supported by OpenStack. It supports vanilla OpenStack across multiple releases and versions, enabling provisioning of compute instances, networking, block storage, object storage, load balancers, DNS, and other OpenStack services.

## Configuration

### Environment Variables

```bash
export OS_AUTH_URL=http://openstack-cloud:5000/v3
export OS_USERNAME=admin
export OS_PASSWORD=secure-password
export OS_TENANT_NAME=admin
export OS_REGION_NAME=RegionOne
```

### Pulumi Config

```bash
pulumi config set openstack:authUrl http://openstack-cloud:5000/v3
pulumi config set openstack:userName admin
pulumi config set openstack:password secure-password --secret
pulumi config set openstack:tenantName admin
pulumi config set openstack:region RegionOne
```

### Authentication Methods

- **Username/Password** with authentication URL
- **Token-based** access
- **Application Credentials** (Identity v3)

### Key Configuration Options

| Option | Environment Variable | Description |
|--------|---------------------|-------------|
| `authUrl` | `OS_AUTH_URL` | Identity authentication endpoint (required) |
| `userName` | `OS_USERNAME` | User name |
| `password` | `OS_PASSWORD` | Login password |
| `token` | `OS_TOKEN` | Temporary access token |
| `tenantName` | `OS_TENANT_NAME` | Project/tenant name |
| `tenantId` | `OS_TENANT_ID` | Project/tenant ID |
| `region` | `OS_REGION_NAME` | OpenStack region |
| `domainName` | `OS_DOMAIN_NAME` | Domain scoping (v3) |
| `cloud` | - | clouds.yaml entry reference |
| `insecure` | - | Trust self-signed certificates |
| `cacertFile` | - | Custom CA certificate path |
| `endpointOverrides` | - | Custom service endpoint URLs |

## Key Resources

- **Compute (Nova)**: `openstack.compute.Instance`
- **Networking (Neutron)**: `openstack.networking.Network`, `openstack.networking.Subnet`, `openstack.networking.SecGroup`
- **Block Storage (Cinder)**: `openstack.blockstorage.Volume`
- **Object Storage (Swift)**: `openstack.objectstorage.Container`
- **Images (Glance)**: `openstack.images.Image`
- **Load Balancing (Octavia)**: `openstack.loadbalancer.LoadBalancer`
- **DNS (Designate)**: `openstack.dns.Zone`, `openstack.dns.RecordSet`
- **Identity (Keystone)**: `openstack.identity.Project`, `openstack.identity.User`
- **Container (Magnum)**: `openstack.containerinfra.Cluster`
- **Shared Filesystem (Manila)**: `openstack.sharedfilesystem.Share`

## Example

```typescript
import * as openstack from "@pulumi/openstack";

// Create a network
const network = new openstack.networking.Network("myNetwork", {
  name: "my-network",
  adminStateUp: true,
});

// Create a subnet
const subnet = new openstack.networking.Subnet("mySubnet", {
  networkId: network.id,
  cidr: "10.0.0.0/24",
  ipVersion: 4,
});

// Create a security group
const secGroup = new openstack.networking.SecGroup("mySecGroup", {
  name: "my-sec-group",
  description: "Allow SSH and HTTP",
});

// Create a compute instance
const server = new openstack.compute.Instance("myServer", {
  name: "my-web-server",
  region: "RegionOne",
  flavorName: "m1.small",
  imageName: "Ubuntu-22.04",
  keyPair: "my-key-pair",
  networks: [{
    uuid: network.id,
  }],
  securityGroups: [secGroup.name],
});

export const serverIp = server.accessIpV4;
```
