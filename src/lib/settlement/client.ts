interface GetLogsOpts {
  address: string;
  fromBlock: bigint;
  toBlock: "latest" | bigint;
}

export function getPublicClient() {
  return {
    async getLogs(_opts: GetLogsOpts) {
      return [];
    },
  };
}
