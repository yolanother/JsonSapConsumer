/*
 * Copyright (c) 2014 Samsung Electronics Co., Ltd.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 *        notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 *       copyright notice, this list of conditions and the following disclaimer
 *       in the documentation and/or other materials provided with the
 *       distribution.
 *     * Neither the name of Samsung Electronics Co., Ltd. nor the names of its
 *       contributors may be used to endorse or promote products derived from
 *       this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

function JsonSap(providerAppName, channel) {
	this.mSocket = null;
	this.mPeerAgent = null;
	this.mChannel = channel;
	this.mAgent = null;
	this.mUnavailable = false;
	this.mProviderAppName = providerAppName;
	this.mCurrentRequest = null;

	this.send = function(msgId, reqData, errorCb) {
		console.log("JsonSap.Request(" + msgId + ")");
	    if (this.mSocket == null || !this.mSocket.isConnected()) {
	        throw {
	            name : 'NotConnectedError',
	            message : 'SAP is not connected'
	        };
	    }

	    if(null != reqData) {
		    console.log("Sending data: " + msgId);
		    this.mSocket.sendData(this.mChannel, JSON.stringify({
		            'type': msgId,
		            'data': reqData}));
		} else {
		    console.log("Sending request: " + msgId);
		    this.mSocket.sendData(this.mChannel, JSON.stringify({
		        'type': msgId}));
	    }
	
	    this.mCurrentRequest = {
	        data : reqData,
	        errorCb : errorCb
	    }
	}

	this.request = function(requestId, errorCb) {
		send(requestId, {}, errorCb);
	}

	this.init = function(successCb, errorCb, dataReceivedCb) {
	    if (this.mUnavailable == true) {
	        console.log('connection failed previously');
	        window.setTimeout(function() {
	            errorCb({
	                name : 'NetworkError',
	                message : 'Connection failed'
	            });
	        }, 0);
	        return;
	    }
	
	    if (this.mSocket != null && isConnected) {
	        console.log('socket already exists');
	        window.setTimeout(function() {
	            successCb();
	        }, 0);
	        return;
	    }
	
	    try {
	        webapis.sa.requestSAAgent(function(agents) {
	            console.log('requestSAAgent succeeded');
	
	            this.mAgent = agents[0];
	
	            this.mAgent.setServiceConnectionListener({
	                onconnect : function(sock) {
	                    console.log('onconnect');
	
	                    this.mSocket = sock;
	                    this.mSocket.setDataReceiveListener(function(channel, respDataJSON) {
	                        var respData = JSON.parse(respDataJSON);
	                        if (null != dataReceivedCb) {
	                            if (respData.type != undefined) {
	                                type = respData.type;
	                            } else if (respData.className != undefined) {
	                                type = respData.className;
	                            } else {
	                                type = "unknown";
	                            }
	
	                            dataReceivedCb(respData.type, respData.data);
	                        }
	                    });
	                    this.mSocket.setSocketStatusListener(function(errCode) {
	                        console.log('socket disconnected : ' + errCode);
	                    });
	                    console.log('completed initialization of service listener');
	                    successCb();
	                },
	                onerror : function(errCode) {
	                    console.log('requestServiceConnection error <' + errCode + '>');
	                    errorCb({
	                        name : 'NetworkError',
	                        message : 'Connection failed'
	                    });
	                }
	            });
	
	            this.mAgent.setPeerAgentFindListener({
	                onpeeragentfound : function(peerAgent) {
	                    if (this.mPeerAgent != null) {
	                        console.log('already get peer agent');
	                        return;
	                    }
	                    try {
	                        if (peerAgent.appName == this.mProviderAppName) {
	                            console.log('peerAgent found');
	
	                            this.mAgent.requestServiceConnection(peerAgent);
	                            this.mPeerAgent = peerAgent;
	                        } else {
	                            console.log('not expected app : ' + peerAgent.appName);
	                        }
	                    } catch (err) {
	                        console.log('exception [' + err.name + '] msg[' + err.message + ']');
	                    }
	                },
	                onerror : function(errCode) {
	                    console.log('findPeerAgents error <' + errCode + '>');
	                    errorCb({
	                        name : 'NetworkError',
	                        message : 'Connection failed'
	                    });
	                }
	            });
	
	            try {
	                this.mPeerAgent = null;
	                this.mAgent.findPeerAgents();
	            } catch (err) {
	                console.log('findPeerAgents exception <' + err.name + '> : ' + err.message);
	                errorCb({
	                    name : 'NetworkError',
	                    message : 'Connection failed'
	                });
	            }
	
	        }, function(err) {
	            console.log('requestSAAgent error <' + err.name + '> : ' + err.message);
	            errorCb({
	                name : 'NetworkError',
	                message : 'Connection failed'
	            });
	        });
	    } catch (err) {
	        console.log('requestSAAgent exception <' + err.name + '> : ' + err.message);
	        window.setTimeout(function() {
	            errorCb({
	                name : 'NetworkError',
	                message : 'Connection failed'
	            });
	        }, 0);
	        this.mUnavailable = true;
	    }
	}
}
