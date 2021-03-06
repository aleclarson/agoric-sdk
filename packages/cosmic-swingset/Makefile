REPOSITORY = agoric/cosmic-swingset
CHAIN_ID = agoric
INITIAL_TOKENS = 1000000000000uag

# By default, make the fake chain in scenario3 produce
# "blocks" as soon as they come in.
FAKE_CHAIN_DELAY = 0

NUM_SOLOS?=1
BASE_PORT?=8000

# On a host machine.  Stay here.
INSPECT_ADDRESS = 127.0.0.1

BREAK_CHAIN = false
NODE_DEBUG = node --inspect-port=$(INSPECT_ADDRESS):9229

NAME := $(shell sed -ne 's/.*"name": "\([^"]*\)".*/\1/p' package.json)
VERSION := $(shell sed -ne 's/.*"version": "\([^"]*\)".*/\1/p' package.json)
COMMIT := $(shell git log -1 --format='%H' 2>/dev/null || cat lib/git-revision.txt)

MOD_READONLY = # -mod=readonly

BIN := $(shell echo $${GOBIN-$${GOPATH-$$HOME/go}/bin})

whitespace :=
whitespace += $(whitespace)
comma := ,
build_tags_comma_sep := $(subst $(whitespace),$(comma),$(build_tags))

# process linker flags
ldflags = -X github.com/cosmos/cosmos-sdk/version.Name=$(NAME) \
		-X github.com/cosmos/cosmos-sdk/version.AppName=ag-cosmos-server \
		-X github.com/cosmos/cosmos-sdk/version.Version=$(VERSION) \
		-X github.com/cosmos/cosmos-sdk/version.Commit=$(COMMIT) \
		-X "github.com/cosmos/cosmos-sdk/version.BuildTags=$(build_tags_comma_sep)"

gcflags =

ifneq ($(GO_DEBUG),)
ldflags += -compressdwarf=false
gcflags += -N -l
endif


ldflags_helper = $(ldflags) \
		  -X github.com/cosmos/cosmos-sdk/version.AppName=ag-cosmos-helper
BUILD_FLAGS := -tags "$(build_tags)" -gcflags '$(gcflags)' -ldflags '$(ldflags)'
BUILD_FLAGS_HELPER :=  -tags "$(build_tags)" -gcflags '$(gcflags)' -ldflags '$(ldflags_helper)'

include Makefile.ledger
all: build-cosmos install

scenario0-setup:
	mkdir -p t9
	rm -rf t9/$(BASE_PORT)

scenario0-run scenario0-run-client:
	AG_SOLO_BASEDIR=$$PWD/t9/$(BASE_PORT) bin/ag-solo setup --webport=$(BASE_PORT)
scenario0-run-chain:
	@echo 'We use the Agoric testnet, not a local chain.'

scenario1-setup: scenario0-setup
scenario1-run-chain:
	@test "`uname -s`" = Linux || \
		{ echo 'Must run under Linux; use "(cd ../deployment && make docker-build) && docker/ag-setup-cosmos bootstrap"'; exit 1; }
	AG_SETUP_COSMOS_HOME=t8 ../deployment/ag-setup-cosmos bootstrap

scenario1-run-client:
	AG_SOLO_BASEDIR=$$PWD/t9/$(BASE_PORT) bin/ag-solo setup --network-config=http://localhost:8001/network-config --webport=$(BASE_PORT)

AGC = ./bin/ag-chain-cosmos
AGCH = ag-cosmos-helper
scenario2-setup: all scenario2-setup-nobuild
scenario2-setup-nobuild:
	rm -rf t1
	mkdir t1
	# Init the chain node.
	$(AGC) --home=t1/n0 init scenario2-chain --chain-id=$(CHAIN_ID)
	# Init all the ag-solos.
	set -e; for port in `seq $(BASE_PORT) $$(($(BASE_PORT) + $(NUM_SOLOS) - 1))`; do \
		bin/ag-solo init t1/$$port --webport=$$port; \
	done
	# Create the bootstrap account.
	mkdir t1/bootstrap
	$(AGCH) --home=t1/bootstrap keys add bootstrap --keyring-backend=test
	$(AGCH) --home=t1/bootstrap keys show -a bootstrap --keyring-backend=test > t1/bootstrap-address
	$(AGC) --home=t1/n0 add-genesis-account `cat t1/bootstrap-address` 100000000uagstake,100provisionpass,100sendpacketpass
	# Create the (singleton) chain node.
	$(AGC) --home=t1/n0 --keyring-dir=t1/bootstrap gentx --keyring-backend=test bootstrap --amount=1000000uagstake --chain-id=$(CHAIN_ID)
	$(AGC) --home=t1/n0 collect-gentxs
	$(AGC) --home=t1/n0 validate-genesis
	../agoric-cli/bin/agoric set-defaults ag-chain-cosmos t1/n0/config
	# Set the chain address in all the ag-solos.
	$(MAKE) set-local-gci-ingress

scenario2-run-chain:
	$(AGC) `$(BREAK_CHAIN) && echo --inspect-brk` --home=t1/n0 start

# Provision and start a client.
scenario2-run-client: t1-provision-one-with-powers t1-start-ag-solo

# Provision the ag-solo from an provisionpass-holding address (idempotent).
t1-provision-one-with-powers:
	addr=$$(cat t1/$(BASE_PORT)/ag-cosmos-helper-address); \
	  $(AGCH) --home=t1/bootstrap query swingset egress $$addr --chain-id=$(CHAIN_ID) || \
	  $(AGCH) --home=t1/bootstrap tx swingset provision-one --keyring-backend=test --from=bootstrap \
		  --gas=auto --gas-adjustment=1.2 --broadcast-mode=block --yes --chain-id=$(CHAIN_ID) \
		  t1/$(BASE_PORT) $$addr agoric.vattp | tee /dev/stderr | grep -q '"code":0'

t1-provision-one:
	addr=$$(cat t1/$(BASE_PORT)/ag-cosmos-helper-address); \
	  $(AGCH) --home=t1/bootstrap query swingset egress $$addr --chain-id=$(CHAIN_ID) || \
	  $(AGCH) --home=t1/bootstrap tx swingset provision-one --keyring-backend=test --from=bootstrap \
		  --gas=auto --gas-adjustment=1.2 --broadcast-mode=block --yes --chain-id=$(CHAIN_ID) \
		  t1/$(BASE_PORT) $$addr | tee /dev/stderr | grep -q '"code":0'

# Actually start the ag-solo.
t1-start-ag-solo:
	cd t1/$(BASE_PORT) && ../../bin/ag-solo start

# scenario3 is a single JS process without any Golang.  However,
# the client and the chain within the process run two separate
# kernels.  There is an artificial delay when handling messages
# destined for the chain kernel, to prevent you from accidentally
# creating programs that won't work on the real blockchain.
#
# If you still want the client/chain separation without delay,
# then run: make scenario3-setup FAKE_CHAIN_DELAY=0
scenario3-setup:
	rm -rf t3
	bin/ag-solo init t3 --egresses=fake --webport=$(BASE_PORT)
	@echo 'Execute `make scenario3-run` to run the client and simulated chain'

# This runs both the client and the fake chain.
scenario3-run-client: scenario3-run
# Set the fake chain here in case the delay has changed.
scenario3-run:
	(cd t3 && \
			../bin/ag-solo set-fake-chain --delay=$(FAKE_CHAIN_DELAY) mySimGCI)
	cd t3 && ../bin/ag-solo start

docker-pull:
	for f in '' -setup -solo; do \
		docker pull $(REPOSITORY)$$f:latest || exit $$?; \
	done

docker-install: docker-pull
	install -m 755 docker/* /usr/local/bin/

compile-go: go.sum
	go install -v $(MOD_READONLY) $(BUILD_FLAGS_HELPER) ./cmd/ag-cosmos-helper
	go build -v $(MOD_READONLY) $(BUILD_FLAGS) -buildmode=c-shared -o lib/libagcosmosdaemon.so lib/agcosmosdaemon.go
	test "`uname -s 2>/dev/null`" != Darwin || install_name_tool -id `pwd`/lib/libagcosmosdaemon.so lib/libagcosmosdaemon.so

build-cosmos: compile-go node-compile-gyp install

compile-debug:
	go install -v $(MOD_READONLY) $(BUILD_FLAGS) ./cmd/ag-cosmos-daemon

# We need this so that node-gyp can be found.
node-compile-gyp:
	if yarn -v >/dev/null 2>&1; then \
		yarn build:gyp; \
	else \
		npm run build:gyp; \
	fi

# Only run from the package.json build:gyp script.
compile-gyp:
	cp binding.gyp.in binding.gyp
	node-gyp configure build $(GYP_DEBUG) || { status=$$?; rm -f binding.gyp; exit $$status; }
	rm -f binding.gyp

install: go.sum
	mkdir -p "${BIN}"
	ln -sf "$$PWD/bin/ag-chain-cosmos" "$$PWD/bin/ag-nchainz" "${BIN}/"

go-mod-cache: go.sum
	@echo "--> Download go modules to local cache"
	@go mod download

go.sum: go.mod
	@echo "--> Ensure dependencies have not been modified"
	GO111MODULE=on go mod verify

start-ag-solo:
	rm -rf t1
	bin/ag-solo init t1
	cd t1 && ../bin/ag-solo start

show-local-gci:
	@./calc-gci.js ~/.ag-chain-cosmos/config/genesis.json

set-local-gci-ingress:
	set -e; \
	gci=`./calc-gci.js t1/n0/config/genesis.json`; \
	rpcport=`./calc-rpcport.js t1/n0/config/config.toml`; \
	for dir in t1/[0-9]*; do \
		(cd $$dir && \
			../../bin/ag-solo set-gci-ingress --chainID=$(CHAIN_ID) $$gci $$rpcport); \
	done

###############################################################################
###                           Protobuf                                    ###
###############################################################################

proto-gen: proto-tools
	./scripts/protocgen.sh

proto-lint: proto-tools
	buf check lint --error-format=json

proto-check-breaking: proto-tools
	buf check breaking --against-input '.git#branch=master'

TM_URL           = https://raw.githubusercontent.com/tendermint/tendermint/v0.34.0-rc3/proto/tendermint
GOGO_PROTO_URL   = https://raw.githubusercontent.com/regen-network/protobuf/cosmos
IBC_PROTO_URL = https://raw.githubusercontent.com/cosmos/cosmos-sdk/master/proto/ibc/core
COSMOS_SDK_PROTO_URL = https://raw.githubusercontent.com/cosmos/cosmos-sdk/master/proto/cosmos/base

GOGO_PROTO_TYPES  = third_party/proto/gogoproto
IBC_CHANNEL_TYPES = third_party/proto/ibc/core/channel/v1
IBC_CLIENT_TYPES = third_party/proto/ibc/core/client/v1
SDK_QUERY_TYPES  	= third_party/proto/cosmos/base/query/v1beta1

proto-update-deps:
	mkdir -p $(GOGO_PROTO_TYPES)
	curl -sSL $(GOGO_PROTO_URL)/gogoproto/gogo.proto > $(GOGO_PROTO_TYPES)/gogo.proto

	mkdir -p $(IBC_CHANNEL_TYPES)
	curl -sSL $(IBC_PROTO_URL)/channel/v1/channel.proto > $(IBC_CHANNEL_TYPES)/channel.proto

	mkdir -p $(IBC_CLIENT_TYPES)
	curl -sSL $(IBC_PROTO_URL)/client/v1/client.proto > $(IBC_CLIENT_TYPES)/client.proto

	mkdir -p $(SDK_QUERY_TYPES)
	curl -sSL $(COSMOS_SDK_PROTO_URL)/query/v1beta1/pagination.proto > $(SDK_QUERY_TYPES)/pagination.proto


UNAME_S ?= $(shell uname -s)
UNAME_M ?= $(shell uname -m)

BUF_VERSION ?= 0.11.0

PROTOC_VERSION ?= 3.11.2
ifeq ($(UNAME_S),Linux)
  PROTOC_ZIP ?= protoc-${PROTOC_VERSION}-linux-x86_64.zip
endif
ifeq ($(UNAME_S),Darwin)
  PROTOC_ZIP ?= protoc-${PROTOC_VERSION}-osx-x86_64.zip
endif

proto-tools: proto-tools-stamp buf

proto-tools-stamp:
	echo "Installing protoc compiler..."
	(cd /tmp; \
	curl -OL "https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOC_VERSION}/${PROTOC_ZIP}"; \
	unzip -o ${PROTOC_ZIP} -d ${BIN}/.. bin/protoc 'include/*'; \
	rm -f ${PROTOC_ZIP})

	echo "Installing protoc-gen-gocosmos..."
	go install github.com/regen-network/cosmos-proto/protoc-gen-gocosmos

	# Create dummy file to satisfy dependency and avoid
	# rebuilding when this Makefile target is hit twice
	# in a row
	touch $@

buf: buf-stamp

buf-stamp:
	echo "Installing buf..."
	curl -sSL \
    "https://github.com/bufbuild/buf/releases/download/v${BUF_VERSION}/buf-${UNAME_S}-${UNAME_M}" \
    -o "${BIN}/buf" && \
	chmod +x "${BIN}/buf"

	touch $@

tools-clean:
	rm -f proto-tools-stamp buf-stamp
