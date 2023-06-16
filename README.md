# Distributed-Download

A prototype for distributed downloading of files over http across multiple devices and interfaces. 

It consists of a server-client architecture where we have a single merge server and multiple clients.

Clients use HTTP Range Requests to get parts of the file and then send it to the merge server where it is reassembled into a complete file.

## Running the merge server:

A `config.json` needs to be created with the following keys:

* `user`: it contains the username for HTTP authentication
* `pass`: it contains the password for HTTP authentication
* `clients`: it contains the number of clients we want to assign partial downloads

The server is written in express, so it is a dependency which needs to be installed. The server can be run simply with:

```
~$ node server.js
Merge server listening on port 3000
HTTP auth username : myuser
HTTP auth password : pass
```
The server has the following endpoints:

* `/register`: endpoint to register a client by sending a `GET` request, it returns a unique randomly generated token
* `/setfileinfo`: endpoint to set the file size and name by sending a `POST` request in JSON format with `fSize` and `fName` keys which contain the file size and name respectively
* `/getrange`: endpoint to get the range of bytes to download for the client by sending a `POST` request in JSON format with the `token` key which should contain the token generated for the client
* `/merge`: endpoint to send pieces of files by sending a `POST` request in JSON format with the `offset` key which contains the file offset to write to and the `data` key which contains base64 encoded binary data for the file

## Running a client:

The client can be run simply with:

```
~$ node client.js -i <Interface IP> -s <URL of merge server> -u <URL of file to download>
```

The Local IP address of the interface used to download the file can be retrieved by running `ipconfig`. This allows us to have multiple clients in the same device using two different interfaces, e.g. An Ethernet connection and a seperate WiFi connection.

Currently, the client sends downloaded data to the merge server in 16 KiB chunks.
