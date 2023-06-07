import netifaces
from netifaces import AF_INET, ifaddresses
import requests


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


def custom_session(addr):
    session = requests.Session()
    for prefix in ('http://', 'https://'):
        # modify pool manager of http adapter to use custom source address
        session.get_adapter(prefix).init_poolmanager(connections=requests.adapters.DEFAULT_POOLSIZE,
                                                     maxsize=requests.adapters.DEFAULT_POOLSIZE,
                                                     source_address=(addr, 0))
    return session
