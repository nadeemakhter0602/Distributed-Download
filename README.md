# Distributed-Download

A prototype for distributed downloading of files over http across multiple devices and interfaces. 

It consists of a server-client architecture where we have a single merge server and multiple clients.

Clients use HTTP Range Requests to get parts of the file and then send it to the merge server where it is reassembled into a complete file.

## Running the merge server:

A `config.json` needs to be created with the following keys:

* `user`: containing the username for HTTP authentication
* `pass`: containing the password for HTTP authentication
* `clients`: containing the number of clients we want to assign partial downloads

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

### Example

Running 3 clients for downloading Arch Linux (IP addresses of the interface and merge server is removed):

```
~$ node client.js -i XXX.XXX.XXX.XXX -u https://geo.mirror.pkgbuild.com/iso/2023.06.01/archlinux-x86_64.iso -s http://myuser:pass@XXX.XXX.XXX.XXX:3000
Client successfully registered with token: 519f333d976eb43e7dece7462006802c6873ac25c79020a71460f64e1680b232655ba0bbbb8c121b79338722b163b83785185f3efba851d2692966bb2d9c541a
Server supports range requests
Size of file in bytes: 828715008
Name of file: archlinux-x86_64.iso
Attempting to download file from 0 to 276238336
File download completed
Uploading file to merge server from 0 to 276238336
File upload complete
```

```
~$ node client.js -i XXX.XXX.XXX.XXX -u https://geo.mirror.pkgbuild.com/iso/2023.06.01/archlinux-x86_64.iso -s http://myuser:pass@XXX.XXX.XXX.XXX:3000
Client successfully registered with token: e03dfb207548e4f0f34ae3b7153b1680f87e1896f675c706b69057c7628f2619bf2b5309be37d3427d677de92b8cd5c50d1000e26b9d783112afa39516543f02
Server supports range requests
Size of file in bytes: 828715008
Name of file: archlinux-x86_64.iso
{ error: 'file size already set' }
Attempting to download file from 276238337 to 552476673
File download completed
Uploading file to merge server from 276238337 to 552476673
File upload complete
```

```
~$ node client.js -i XXX.XXX.XXX.XXX -u https://geo.mirror.pkgbuild.com/iso/2023.06.01/archlinux-x86_64.iso -s http://myuser:pass@XXX.XXX.XXX.XXX:3000
Client successfully registered with token: 7ca6b24d7766fdaa14b55c4aa3c161499a3479a2db93d426ac7c5bdf31933249dbb4f747e15cf4121cc0b9ff097f6e32ed300a137b199a91424442f787e4c858
Server supports range requests
Size of file in bytes: 828715008
Name of file: archlinux-x86_64.iso
{ error: 'file size already set' }
Attempting to download file from 552476674 to 828715007
File download completed
Uploading file to merge server from 552476674 to 828715007
File upload complete
```
