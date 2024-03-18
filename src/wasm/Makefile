WASI_SDK=/opt/wasi-sdk

WASM=1

CFLAGS_OPTIMIZATION = -O3 -flto

CFLAGS= $(CFLAGS_OPTIMIZATION)

CXXFLAGS = $(CFLAGS_OPTIMIZATION) -fno-exceptions -I include -I lib/json/include

LDFLAGS = -lc -lc++ -lc++abi

CC=clang
CXX=clang++
LD=ld
ifeq ($(WASM), 1)
	CC=$(WASI_SDK)/bin/clang
	CXX=$(WASI_SDK)/bin/clang++
	LD=$(WASI_SDK)/bin/wasm-ld
	LDFLAGS += --no-entry --export-dynamic --import-memory --unresolved-symbols=report-all -L $(WASI_SDK)/share/wasi-sysroot/lib/wasm32-wasi -L $(WASI_SDK)/lib/clang/17/lib/wasi -lclang_rt.builtins-wasm32 --lto-O3
else
	CXXFLAGS += -stdlib=libc++
endif

OBJFILES = source/main.o

TARGET = main

ifeq ($(WASM), 1)
$(TARGET): $(OBJFILES)
	$(LD) $(LDFLAGS) $(OBJFILES) -o $@.wasm
	wasm-opt $(TARGET).wasm -Oz -o $(TARGET).wasm
	wasm-strip $(TARGET).wasm
	wasm2wat $(TARGET).wasm > $(TARGET).wast
	cp $(TARGET).wasm ../../public/wasm/$(TARGET).wasm
else
$(TARGET): $(OBJFILES)
	$(CXX) $(CXXFLAGS) $(OBJFILES) -o $@.elf
endif

clean:
	rm -f $(TARGET) $(TARGET).wasm $(TARGET).wast $(OBJFILES) $(TARGET).elf