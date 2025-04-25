import { createRequestHandler } from "../../lib/server-runtime/server";
import { ErrorResponseImpl } from "../../lib/router/utils";
import { mockServerBuild } from "./utils";
import type { HandleDocumentRequestFunction } from "../../lib/server-runtime/build";

function getHandler(
  routeModule = {},
  opts: {
    handleDocumentRequest?: HandleDocumentRequestFunction;
  } = {}
) {
  let handleErrorSpy = jest.fn();
  let build = mockServerBuild(
    {
      root: {
        path: "/",
        default() {},
        ...routeModule,
      },
    },
    {
      handleError: handleErrorSpy,
      handleDocumentRequest: opts.handleDocumentRequest,
    }
  );

  return {
    handler: createRequestHandler(build),
    handleErrorSpy,
  };
}

describe("handleError", () => {
  describe("document request", () => {
    it("provides user-thrown Error", async () => {
      let error = new Error("💥");
      let { handler, handleErrorSpy } = getHandler({
        loader() {
          throw error;
        },
      });
      let request = new Request("http://example.com/");
      await handler(request);
      expect(handleErrorSpy).toHaveBeenCalledWith(error, {
        request,
        params: {},
        context: {},
      });
    });

    it("provides router-thrown ErrorResponse", async () => {
      let { handler, handleErrorSpy } = getHandler({});
      let request = new Request("http://example.com/", { method: "post" });
      await handler(request);
      expect(handleErrorSpy).toHaveBeenCalledWith(
        new ErrorResponseImpl(
          405,
          "Method Not Allowed",
          new Error(
            'You made a POST request to "/" but did not provide an `action` for route "root", so there is no way to handle the request.'
          ),
          true
        ),
        {
          request,
          params: {},
          context: {},
        }
      );
    });

    it("provides render-thrown Error", async () => {
      let { handler, handleErrorSpy } = getHandler(undefined, {
        handleDocumentRequest() {
          throw new Error("Render error");
        },
      });
      let request = new Request("http://example.com/");
      await handler(request);
      expect(handleErrorSpy).toHaveBeenCalledWith(new Error("Render error"), {
        request,
        params: {},
        context: {},
      });
    });

    it("does not provide user-thrown Responses to handleError", async () => {
      let { handler, handleErrorSpy } = getHandler({
        loader() {
          throw Response.json(
            { message: "not found" },
            { status: 404, statusText: "Not Found" }
          );
        },
      });
      let request = new Request("http://example.com/");
      await handler(request);
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe("data request", () => {
    it("provides user-thrown Error", async () => {
      let error = new Error("💥");
      let { handler, handleErrorSpy } = getHandler({
        loader() {
          throw error;
        },
      });
      let request = new Request("http://example.com/?_data=root");
      await handler(request);
      expect(handleErrorSpy).toHaveBeenCalledWith(error, {
        request,
        params: {},
        context: {},
      });
    });

    it("provides router-thrown ErrorResponse", async () => {
      let { handler, handleErrorSpy } = getHandler({});
      let request = new Request("http://example.com/?_data=root", {
        method: "post",
      });
      await handler(request);
      expect(handleErrorSpy).toHaveBeenCalledWith(
        new ErrorResponseImpl(
          405,
          "Method Not Allowed",
          new Error(
            'You made a POST request to "/" but did not provide an `action` for route "root", so there is no way to handle the request.'
          ),
          true
        ),
        {
          request,
          params: {},
          context: {},
        }
      );
    });

    it("does not provide user-thrown Responses to handleError", async () => {
      let { handler, handleErrorSpy } = getHandler({
        loader() {
          throw Response.json(
            { message: "not found" },
            { status: 404, statusText: "Not Found" }
          );
        },
      });
      let request = new Request("http://example.com/?_data=root");
      await handler(request);
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe("resource request", () => {
    it("provides user-thrown Error", async () => {
      let error = new Error("💥");
      let { handler, handleErrorSpy } = getHandler({
        loader() {
          throw error;
        },
        default: null,
      });
      let request = new Request("http://example.com/");
      await handler(request);
      expect(handleErrorSpy).toHaveBeenCalledWith(error, {
        request,
        params: {},
        context: {},
      });
    });

    it("provides router-thrown ErrorResponse", async () => {
      let { handler, handleErrorSpy } = getHandler({ default: null });
      let request = new Request("http://example.com/", {
        method: "post",
      });
      await handler(request);
      expect(handleErrorSpy).toHaveBeenCalledWith(
        new ErrorResponseImpl(
          405,
          "Method Not Allowed",
          new Error(
            'You made a POST request to "/" but did not provide an `action` for route "root", so there is no way to handle the request.'
          ),
          true
        ),
        {
          request,
          params: {},
          context: {},
        }
      );
    });

    it("does not provide user-thrown Responses to handleError", async () => {
      let { handler, handleErrorSpy } = getHandler({
        loader() {
          throw Response.json(
            { message: "not found" },
            { status: 404, statusText: "Not Found" }
          );
        },
        default: null,
      });
      let request = new Request("http://example.com/");
      await handler(request);
      expect(handleErrorSpy).not.toHaveBeenCalled();
    });
  });
});

// let request = new Request(
//   "http://example.com/random?_data=routes/random&foo=bar",
//   {
//     method: "post",
//     // headers: {
//     //   "Content-Type": "application/json",
//     // },
//   }
// );
