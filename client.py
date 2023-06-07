import netifaces
from netifaces import AF_INET, ifaddresses
import requests
import argparse


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


def get_session(ipaddr):
    session = requests.Session()
    if not ipaddr:
        return session
    for prefix in ('http://', 'https://'):
        # modify pool manager of http adapter to use custom source address
        session.get_adapter(prefix).init_poolmanager(connections=requests.adapters.DEFAULT_POOLSIZE,
                                                     maxsize=requests.adapters.DEFAULT_POOLSIZE,
                                                     source_address=(ipaddr, 0))
    return session


def start(url, ipaddr, server):
    session = get_session(ipaddr)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-i',
                        '--interface',
                        help="Source IP Address of interface to use",
                        type=str,
                        default=None)
    parser.add_argument('-u',
                        '--url',
                        help="URL of resource to download",
                        type=str)
    parser.add_argument('-s',
                        '--server',
                        help="Address of coordinating server",
                        type=str)
    args = parser.parse_args()
    # get arguments
    ipaddr = args.interface
    url = args.url
    server = args.server
    # check if interface with provided source ip address exists
    if ipaddr not in get_ipaddrs():
        raise RuntimeError("No Interface with provided Source IP Address")
    start(url, ipaddr, server)
