import netifaces
from netifaces import AF_INET, ifaddresses


def get_ipaddrs():
    ipaddrs = []
    # iterate over interfaces
    for iface in netifaces.interfaces():
        addrs = netifaces.ifaddresses(iface)
        # check if interface has an IP address
        if AF_INET in addrs:
            # get IP address
            ipaddr = addrs[AF_INET][0].get('addr')
            ipaddrs.append(ipaddr)
    return ipaddrs
