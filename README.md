# Distributed-Download

A prototype for distributed downloading of files over http across multiple devices and interfaces. 

It consists of a server-client architecture where we have a single merge server and multiple clients.

Clients use HTTP Range Requests to get parts of the file and then send it to the merge server where it is reassembled into a complete file.